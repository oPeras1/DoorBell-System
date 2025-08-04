package com.operas.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/door")
public class DoorController {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping
    public ResponseEntity<?> openDoor() {
        String url = "https://doorbell-real.houseofknowledge.pt/open?key=" + jwtSecret;

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.ok("Door opened successfully: " + response.getBody());
            } else {
                return ResponseEntity.status(response.getStatusCode())
                        .body("Failed to open door. Status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error contacting doorbell API: " + e.getMessage());
        }
    }
}
