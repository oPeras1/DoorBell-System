package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.operas.model.User;
import com.operas.model.Party;
import com.operas.model.Log;
import com.operas.repository.PartyRepository;
import com.operas.repository.LogRepository;
import com.operas.exceptions.DoorOpenException;

import java.time.LocalDateTime;
import java.util.List;

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

    @Autowired
    private MqttGateway mqttGateway;

    @Value("${jwt.secret}")
    private String jwtSecret;

    public ResponseEntity<?> openDoor(User user, Double latitude, Double longitude) {
        // Check for slowdown: limit to 2 door opens per 10 seconds
        LocalDateTime tenSecondsAgo = LocalDateTime.now().minusSeconds(10);
        List<Log> recentLogs = logRepository.findByUser_IdAndLogTypeAndTimestampAfter(user.getId(), "DOOR_OPEN", tenSecondsAgo);
        if (recentLogs.size() >= 2) {
            throw new DoorOpenException("Too many door opens in the last 10 seconds. Please wait.");
        }

        if (user.isMuted() && user.getType() != User.UserType.KNOWLEDGER) {
            throw new DoorOpenException("You are muted and cannot open the door.");
        }

        if (user.getType() == User.UserType.GUEST) {
            List<Party> parties = partyRepository.findAll();
            LocalDateTime now = LocalDateTime.now();

            // Update automatic statuses before filtering
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
            // Always open the outer door
            mqttGateway.publish("doorbell/open", "{\"key\":\"" + jwtSecret + "\"}");
            
            StringBuilder responseMessage = new StringBuilder();
            boolean shouldOpenInnerDoor = false;
            
            responseMessage.append("Outer door opened successfully");
            logRepository.save(new Log("User " + user.getUsername() + " opened the outer door", user, "DOOR_OPEN"));
            
            // Check if we should attempt to open inner door
            if (user.isMultipleDoorOpen() && latitude != null && longitude != null) {
                try {
                    Double travelTime = routingService.getTravelTime(latitude, longitude);
                    if (travelTime != null && travelTime < 60.0) { // Less than 1 minute (60 seconds)
                        shouldOpenInnerDoor = true;
                        logRepository.save(new Log("User " + user.getUsername() + " qualified for inner door opening (travel time: " + String.format("%.1f", travelTime) + "s)", user, "DOOR_OPEN"));
                    } else {
                        logRepository.save(new Log("User " + user.getUsername() + " did not qualify for inner door opening (travel time: " + (travelTime != null ? String.format("%.1f", travelTime) + "s" : "unknown") + ")", user, "DOOR_OPEN"));
                    }
                } catch (Exception routingError) {
                    logRepository.save(new Log("Failed to calculate travel time for user " + user.getUsername() + ": " + routingError.getMessage(), user, "DOOR_OPEN_ERROR"));
                }
            }
            
            // Attempt to open inner door if conditions are met
            if (shouldOpenInnerDoor) {
                mqttGateway.publish("doorbell/servo", "{\"key\":\"" + jwtSecret + "\"}");
                responseMessage.append(" and inner door opened successfully");
                logRepository.save(new Log("User " + user.getUsername() + " opened both outer and inner doors", user, "DOOR_OPEN"));
            } else if (user.isMultipleDoorOpen()) {
                responseMessage.append(" (inner door not opened - location/timing requirements not met)");
            }
            
            // Send notification to knowledgers and housers
            notificationService.sendDoorOpenedNotification(user);
            
            return ResponseEntity.ok(responseMessage.toString());

        } catch (Exception e) {
            // Log door open error
            logRepository.save(new Log("Door open error for user " + user.getUsername() + ": " + e.getMessage(), user, "DOOR_OPEN_ERROR"));
            throw new DoorOpenException("Error contacting doorbell API: " + e.getMessage());
        }
    }

    // Keep the old method signature for backward compatibility
    public ResponseEntity<?> openDoor(User user) {
        return openDoor(user, null, null);
    }
}
