package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    public ResponseEntity<?> openDoor(String DOORBELL_API_BASE_URL, User user, Double latitude, Double longitude) {
        String urlOut = DOORBELL_API_BASE_URL + "/open?key=" + jwtSecret;
        String urlIn = DOORBELL_API_BASE_URL + "/servo?key=" + jwtSecret;

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
            ResponseEntity<String> outerResponse = restTemplate.getForEntity(urlOut, String.class);
            boolean outerDoorSuccess = outerResponse.getStatusCode().is2xxSuccessful();
            
            StringBuilder responseMessage = new StringBuilder();
            boolean shouldOpenInnerDoor = false;
            
            if (outerDoorSuccess) {
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
                    try {
                        ResponseEntity<String> innerResponse = restTemplate.getForEntity(urlIn, String.class);
                        if (innerResponse.getStatusCode().is2xxSuccessful()) {
                            responseMessage.append(" and inner door opened successfully");
                            logRepository.save(new Log("User " + user.getUsername() + " opened both outer and inner doors", user, "DOOR_OPEN"));
                        } else {
                            responseMessage.append(" but inner door failed to open");
                            logRepository.save(new Log("Inner door opening failed for user " + user.getUsername() + ". Status: " + innerResponse.getStatusCode(), user, "DOOR_OPEN_FAILED"));
                        }
                    } catch (Exception innerDoorError) {
                        responseMessage.append(" but inner door encountered an error");
                        logRepository.save(new Log("Inner door error for user " + user.getUsername() + ": " + innerDoorError.getMessage(), user, "DOOR_OPEN_ERROR"));
                    }
                } else if (user.isMultipleDoorOpen()) {
                    responseMessage.append(" (inner door not opened - location/timing requirements not met)");
                }
                
                // Send notification to knowledgers and housers
                notificationService.sendDoorOpenedNotification(user);
                
                return ResponseEntity.ok(responseMessage.toString());
            } else {
                // Log outer door failure
                logRepository.save(new Log("Outer door opening failed for user " + user.getUsername() + ". Status: " + outerResponse.getStatusCode(), user, "DOOR_OPEN_FAILED"));
                return ResponseEntity.status(outerResponse.getStatusCode())
                        .body("Failed to open outer door. Status: " + outerResponse.getStatusCode());
            }

        } catch (Exception e) {
            // Log door open error
            logRepository.save(new Log("Door open error for user " + user.getUsername() + ": " + e.getMessage(), user, "DOOR_OPEN_ERROR"));
            throw new DoorOpenException("Error contacting doorbell API: " + e.getMessage());
        }
    }

    // Keep the old method signature for backward compatibility
    public ResponseEntity<?> openDoor(String DOORBELL_API_BASE_URL, User user) {
        return openDoor(DOORBELL_API_BASE_URL, user, null, null);
    }
}
