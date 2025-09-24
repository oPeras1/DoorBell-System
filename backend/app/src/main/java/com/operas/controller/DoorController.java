package com.operas.controller;

import com.operas.service.MqttGateway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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

    @Autowired
    private MqttGateway mqttGateway;

    private static final String DOORBELL_API_BASE_URL = "https://doorbell-real.houseofknowledge.pt";

    @Autowired
    private DoorService doorService;

    @Autowired
    private KnowledgerService knowledgerService;

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
        mqttGateway.publish("doorbell/ping", "{}");
        return ResponseEntity.ok(Map.of("status", "ping_sent"));
    }

    @GetMapping("/environment")
    public ResponseEntity<?> environment(@AuthenticationPrincipal CustomUserDetails userDetails) {
        mqttGateway.publish("doorbell/environment", "{}");
        return ResponseEntity.ok(Map.of("status", "environment_request_sent"));
    }

    @GetMapping("/online")
    public ResponseEntity<?> online(@AuthenticationPrincipal CustomUserDetails userDetails) {
        mqttGateway.publish("doorbell/online", "{}");
        return ResponseEntity.ok(Map.of("status", "online_request_sent"));
    }
}