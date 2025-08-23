package com.operas.controller;

import com.operas.security.CustomUserDetails;
import com.operas.service.RoutingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/routing")
public class RoutingController {
    
    @Autowired
    private RoutingService routingService;
    
    @PostMapping("/travel-time")
    public ResponseEntity<?> getTravelTime(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Double> coordinates) {
        
        if (!coordinates.containsKey("latitude") || !coordinates.containsKey("longitude")) {
            return ResponseEntity.badRequest().body("Latitude and longitude are required");
        }
        
        double userLat = coordinates.get("latitude");
        double userLng = coordinates.get("longitude");
        
        try {
            Double travelTime = routingService.getTravelTime(userLat, userLng);
            
            Map<String, Object> response = new HashMap<>();
            response.put("travelTimeSeconds", travelTime);
            response.put("travelTimeMinutes", Math.round(travelTime / 60.0 * 100.0) / 100.0);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error calculating travel time: " + e.getMessage());
        }
    }
}
