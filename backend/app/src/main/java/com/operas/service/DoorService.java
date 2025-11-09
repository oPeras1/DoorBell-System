package com.operas.service;

import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import com.operas.model.User;
import com.operas.model.Party;
import com.operas.model.Log;
import com.operas.repository.PartyRepository;
import com.operas.repository.LogRepository;
import com.operas.exceptions.DoorOpenException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class DoorService {

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private PartyService partyService;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private RoutingService routingService;

    @Value("${jwt.secret}")
    private String jwtSecret;

    // MQTT broker configuration
    private static final String MQTT_BROKER = "tcp://localhost:1883";
    private static final String MQTT_USERNAME = "doorbell";
    private static final String MQTT_PASSWORD = "hhoeZN68DCOyGR7wy9P9";

    private static final String TOPIC_OPEN_OUTER = "doorbell/open/outer";
    private static final String TOPIC_OPEN_INNER = "doorbell/open/inner";
    private static final String TOPIC_STATUS = "doorbell/open/status";

    private final MqttClient mqttClient;

    public DoorService() throws MqttException {
        mqttClient = new MqttClient(MQTT_BROKER, MqttClient.generateClientId(), new MemoryPersistence());

        MqttConnectOptions options = new MqttConnectOptions();
        options.setUserName(MQTT_USERNAME);
        options.setPassword(MQTT_PASSWORD.toCharArray());
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);

        mqttClient.connect(options);
    }

    public ResponseEntity<?> openDoor(User user, Double latitude, Double longitude) {

        // Rate limiting (same as before)
        LocalDateTime tenSecondsAgo = LocalDateTime.now().minusSeconds(10);
        List<Log> recentLogs = logRepository.findByUser_IdAndLogTypeAndTimestampAfter(
                user.getId(), "DOOR_OPEN", tenSecondsAgo
        );
        if (recentLogs.size() >= 2) {
            throw new DoorOpenException("Too many door opens in the last 10 seconds. Please wait.");
        }

        if (user.isMuted() && user.getType() != User.UserType.KNOWLEDGER) {
            throw new DoorOpenException("You are muted and cannot open the door.");
        }

        // Guest validation
        if (user.getType() == User.UserType.GUEST) {
            List<Party> parties = partyRepository.findAll();
            LocalDateTime now = LocalDateTime.now();
            parties.forEach(party -> partyService.updateAutomaticStatus(party, now));

            boolean canOpen = parties.stream().anyMatch(party ->
                party.getStatus() == Party.PartyStatus.IN_PROGRESS &&
                party.getGuests() != null &&
                party.getGuests().stream().anyMatch(gs -> gs.getUser().getId().equals(user.getId()))
            );

            if (!canOpen) {
                throw new DoorOpenException("You are not invited to any ongoing party.");
            }
        }

        try {
            // Open outer door via MQTT
            CompletableFuture<Boolean> outerFuture = new CompletableFuture<>();
            mqttClient.subscribe(TOPIC_STATUS, (topic, message) -> {
                String payload = new String(message.getPayload());
                if (payload.contains("outer_success")) outerFuture.complete(true);
                if (payload.contains("outer_failed")) outerFuture.complete(false);
            });

            mqttClient.publish(TOPIC_OPEN_OUTER, new MqttMessage("open".getBytes()));
            boolean outerSuccess = outerFuture.get(5, TimeUnit.SECONDS); // wait up to 5s

            if (!outerSuccess) {
                logRepository.save(new Log("Outer door failed to open for user " + user.getUsername(), user, "DOOR_OPEN_FAILED"));
                return ResponseEntity.status(503).body("Outer door failed to open");
            }

            logRepository.save(new Log("Outer door opened successfully for user " + user.getUsername(), user, "DOOR_OPEN"));
            StringBuilder responseMessage = new StringBuilder("Outer door opened successfully");

            boolean shouldOpenInner = false;
            if (user.isMultipleDoorOpen() && latitude != null && longitude != null) {
                Double travelTime = routingService.getTravelTime(latitude, longitude);
                if (travelTime != null && travelTime < 120.0) shouldOpenInner = true;
            }

            if (shouldOpenInner) {
                CompletableFuture<Boolean> innerFuture = new CompletableFuture<>();
                mqttClient.subscribe(TOPIC_STATUS, (topic, message) -> {
                    String payload = new String(message.getPayload());
                    if (payload.contains("inner_success")) innerFuture.complete(true);
                    if (payload.contains("inner_failed")) innerFuture.complete(false);
                });

                mqttClient.publish(TOPIC_OPEN_INNER, new MqttMessage("open".getBytes()));
                boolean innerSuccess = innerFuture.get(5, TimeUnit.SECONDS);

                if (innerSuccess) {
                    responseMessage.append(" and inner door opened successfully");
                    logRepository.save(new Log("Inner door opened for user " + user.getUsername(), user, "DOOR_OPEN"));
                } else {
                    responseMessage.append(" but inner door failed");
                    logRepository.save(new Log("Inner door failed for user " + user.getUsername(), user, "DOOR_OPEN_FAILED"));
                }
            }

            notificationService.sendDoorOpenedNotification(user);
            return ResponseEntity.ok(responseMessage.toString());

        } catch (Exception e) {
            logRepository.save(new Log("Door open error for user " + user.getUsername() + ": " + e.getMessage(), user, "DOOR_OPEN_ERROR"));
            throw new DoorOpenException("Error opening door via MQTT: " + e.getMessage());
        }
    }

    public ResponseEntity<?> openDoor(User user) {
        return openDoor(user, null, null);
    }
}
