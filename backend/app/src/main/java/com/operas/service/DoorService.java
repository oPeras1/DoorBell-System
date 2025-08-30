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

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    public ResponseEntity<?> openDoor(String DOORBELL_API_BASE_URL, User user) {
        String url = DOORBELL_API_BASE_URL + "/open?key=" + jwtSecret;

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
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                // Log successful door open
                logRepository.save(new Log("User " + user.getUsername() + " opened the door", user, "DOOR_OPEN"));
                return ResponseEntity.ok("Door opened successfully: " + response.getBody());
            } else {
                // Log door open failure
                logRepository.save(new Log("Door open attempt failed for user " + user.getUsername() + ". Status: " + response.getStatusCode(), user, "DOOR_OPEN_FAILED"));
                return ResponseEntity.status(response.getStatusCode())
                        .body("Failed to open door. Status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            // Log door open error
            logRepository.save(new Log("Door open error for user " + user.getUsername() + ": " + e.getMessage(), user, "DOOR_OPEN_ERROR"));
            throw new DoorOpenException("Error contacting doorbell API: " + e.getMessage());
        }
    }
}
