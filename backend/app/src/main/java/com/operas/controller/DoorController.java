package com.operas.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

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

    @PostMapping("/bell-event")
    public ResponseEntity<?> bellEvent(
            @RequestParam(value = "token", required = false) String apiToken,
            @RequestBody(required = false) Map<String, Object> requestData) {
        
        // Check if API token is provided and valid
        if (apiToken == null || apiToken.isEmpty()) {
            System.out.println("Bell event rejected: No API token provided");
            return ResponseEntity.badRequest().body("API token is required");
        }
        
        if (!apiToken.equals(jwtSecret)) {
            System.out.println("Bell event rejected: Invalid API token");
            return ResponseEntity.status(401).body("Invalid API token");
        }
        
        System.out.println("Bell event received with valid token");
        
        // Process additional data if provided
        if (requestData != null && !requestData.isEmpty()) {
            System.out.println("Additional data received:");
            requestData.forEach((key, value) -> 
                System.out.println("  " + key + ": " + value)
            );
        }
        
        return ResponseEntity.ok("Bell event received and processed successfully");
    }
}
