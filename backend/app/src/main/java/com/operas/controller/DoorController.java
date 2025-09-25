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
import com.operas.service.ArduinoDataService;
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

    @Autowired
    private ArduinoDataService arduinoDataService;

    @PostMapping
    public ResponseEntity<?> openDoor(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody(required = false) Map<String, Object> requestBody) {
        if (knowledgerService.isMaintenanceActive() &&
            userDetails.getUser().getType() != com.operas.model.User.UserType.KNOWLEDGER) {
            throw new DoorOpenException("Door opening is disabled during maintenance mode");
        }
        
        // Extract coordinates if provided
        Double latitude = null;
        Double longitude = null;
        if (requestBody != null) {
            if (requestBody.containsKey("latitude")) {
                latitude = ((Number) requestBody.get("latitude")).doubleValue();
            }
            if (requestBody.containsKey("longitude")) {
                longitude = ((Number) requestBody.get("longitude")).doubleValue();
            }
        }
        
        return doorService.openDoor(DOORBELL_API_BASE_URL, userDetails.getUser(), latitude, longitude);
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
        Map<String, Object> cachedData = arduinoDataService.getPingData();

        if (cachedData != null) {
            long lastUpdated = (long) cachedData.get("last_updated");
            long elapsedSeconds = (System.currentTimeMillis() - lastUpdated) / 1000;

            long days = ((Number) cachedData.get("uptime_days")).longValue();
            long hours = ((Number) cachedData.get("uptime_hours")).longValue();
            long minutes = ((Number) cachedData.get("uptime_minutes")).longValue();
            long seconds = ((Number) cachedData.get("uptime_seconds")).longValue();

            long totalSeconds = (days * 86400) + (hours * 3600) + (minutes * 60) + seconds + elapsedSeconds;

            long newDays = totalSeconds / 86400;
            long newHours = (totalSeconds % 86400) / 3600;
            long newMinutes = (totalSeconds % 3600) / 60;
            long newSeconds = totalSeconds % 60;

            Map<String, Object> result = Map.of(
                "status", "online",
                "ping", cachedData.get("ping"),
                "uptime_days", newDays,
                "uptime_hours", newHours,
                "uptime_minutes", newMinutes,
                "uptime_seconds", newSeconds
            );
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.status(503).body(Map.of("status", "offline"));
        }
    }

    @GetMapping("/environment")
    public ResponseEntity<?> environment(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> data = arduinoDataService.getEnvironmentData();
        if (data != null) {
            return ResponseEntity.ok(data);
        } else {
            return ResponseEntity.status(503).body(Map.of("error", "Environment data not available"));
        }
    }

    @GetMapping("/online")
    public ResponseEntity<?> online(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String url = DOORBELL_API_BASE_URL + "/online";
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            Map<String, Object> body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null && 
                Boolean.TRUE.equals(body.get("online"))) {
                Map<String, Object> result = Map.of("status", "online");
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> result = Map.of("status", "offline");
                return ResponseEntity.status(503).body(result);
            }
        } catch (Exception e) {
            throw new DoorPingException("Error contacting online service: " + e.getMessage());
        }
    }
}