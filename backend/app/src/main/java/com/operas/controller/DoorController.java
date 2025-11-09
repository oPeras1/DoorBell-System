package com.operas.controller;

import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import com.operas.exceptions.DoorPingException;
import com.operas.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.operas.service.DoorService;
import com.operas.service.KnowledgerService;
import com.operas.service.ArduinoDataService;
import com.operas.service.DoorbellMqttService;
import com.operas.exceptions.DoorOpenException;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.concurrent.*;

@RestController
@RequestMapping("/door")
public class DoorController {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private DoorService doorService;

    @Autowired
    private KnowledgerService knowledgerService;

    @Autowired
    private ArduinoDataService arduinoDataService;
    
    // MQTT
    private final DoorbellMqttService doorbellMqttService;

    // Constructor to initialize MQTT client
    @Autowired
    public DoorController(DoorbellMqttService doorbellMqttService) {
        this.doorbellMqttService = doorbellMqttService;
    }

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
        
        return doorService.openDoor(userDetails.getUser(), latitude, longitude);
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
        try {
            boolean isOnline = doorbellMqttService.isDeviceOnline();
            if (isOnline) {
                return ResponseEntity.ok(Map.of("status", "online"));
            } else {
                return ResponseEntity.status(503).body(Map.of("status", "offline"));
            }
        } catch (Exception e) {
            throw new DoorPingException("Error checking device status via MQTT: " + e.getMessage());
        }
    }
}