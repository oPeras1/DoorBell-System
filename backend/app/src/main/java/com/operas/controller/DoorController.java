package com.operas.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.Map;
import com.operas.exceptions.DoorPingException;
import com.operas.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.operas.service.DoorService;
import com.operas.service.KnowledgerService;
import com.operas.exceptions.DoorOpenException;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/door")
public class DoorController {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private static final String DOORBELL_API_BASE_URL = "https://doorbell-real.houseofknowledge.pt";
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private DoorService doorService;

    @Autowired
    private KnowledgerService knowledgerService;

    @PostMapping
    public ResponseEntity<?> openDoor(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (knowledgerService.isMaintenanceActive() &&
            userDetails.getUser().getType() != com.operas.model.User.UserType.KNOWLEDGER) {
            throw new DoorOpenException("Door opening is disabled during maintenance mode");
        }
        return doorService.openDoor(DOORBELL_API_BASE_URL, userDetails.getUser());
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

    @GetMapping("/ping")
    public ResponseEntity<?> ping(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String url = DOORBELL_API_BASE_URL + "/ping";
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                Map<String, Object> result = Map.of(
                    "status", "online",
                    "ping", body.get("ping"),
                    "uptime_days", body.get("uptime_days"),
                    "uptime_hours", body.get("uptime_hours"),
                    "uptime_minutes", body.get("uptime_minutes"),
                    "uptime_seconds", body.get("uptime_seconds")
                );
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> result = Map.of(
                    "status", "offline"
                );
                return ResponseEntity.status(503).body(result);
            }
        } catch (Exception e) {
            throw new DoorPingException("Error contacting ping service: " + e.getMessage());
        }
    }

    @GetMapping("/environment")
    public ResponseEntity<?> environment(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String url = DOORBELL_API_BASE_URL + "/environment";
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                Map<String, Object> result = Map.of(
                    "temperature", body.get("temperature"),
                    "humidity", body.get("humidity")
                );
                return ResponseEntity.ok(result);
            } else {
                throw new DoorPingException("Failed to get response from environment service.");
            }
        } catch (Exception e) {
            throw new DoorPingException("Error contacting environment service: " + e.getMessage());
        }
    }
}