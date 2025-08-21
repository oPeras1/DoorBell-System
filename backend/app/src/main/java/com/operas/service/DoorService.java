package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.operas.model.User;
import com.operas.model.Party;
import com.operas.repository.PartyRepository;
import com.operas.exceptions.DoorOpenException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DoorService {
    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private PartyService partyService;

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
                return ResponseEntity.ok("Door opened successfully: " + response.getBody());
            } else {
                return ResponseEntity.status(response.getStatusCode())
                        .body("Failed to open door. Status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            throw new DoorOpenException("Error contacting doorbell API: " + e.getMessage());
        }
    }
}
