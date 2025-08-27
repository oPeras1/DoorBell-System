package com.operas.controller;

import com.operas.dto.UserDto;
import com.operas.security.CustomUserDetails;
import com.operas.service.UserService;
import com.operas.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/")
    public Iterable<UserDto> getAllUsers(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return userService.getAllUsers(userDetails);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        UserDto userDto = userService.getUserById(userDetails, id);
        return ResponseEntity.ok(userDto);
    }

    @GetMapping("/me")
    public UserDto getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return userService.getCurrentUser(userDetails);
    }

    @PutMapping("/me/onesignal")
    public ResponseEntity<?> updateOneSignalId(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> request) {
        String onesignalId = request.get("onesignalId");
        userService.updateOneSignalId(userDetails.getUser().getId(), onesignalId);
        return ResponseEntity.ok("OneSignal ID updated successfully");
    }

    @DeleteMapping("/me/onesignal")
    public ResponseEntity<?> removeOneSignalId(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> request) {
        String onesignalId = request.get("onesignalId");
        userService.removeOneSignalId(userDetails.getUser().getId(), onesignalId);
        return ResponseEntity.ok("OneSignal ID removed successfully");
    }

    @PutMapping("/me/status")
    public ResponseEntity<?> changeStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        userService.changeStatus(userDetails, status);
        return ResponseEntity.ok("Status updated successfully");
    }

    @PutMapping("/muted")
    public ResponseEntity<?> updateMuted(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> request) {
        Long targetId = null;
        Boolean muted = null;
        if (request.containsKey("targetId")) {
            Object idObj = request.get("targetId");
            if (idObj instanceof Number) {
                targetId = ((Number) idObj).longValue();
            } else if (idObj instanceof String) {
                targetId = Long.parseLong((String) idObj);
            }
        }
        if (request.containsKey("muted")) {
            muted = (Boolean) request.get("muted");
        }
        userService.updateMuted(userDetails, targetId, muted);
        return ResponseEntity.ok("Muted status updated successfully");
    }

    @PutMapping("/{id}/type")
    public ResponseEntity<?> changeType(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String type = request.get("type");
        userService.changeType(userDetails, id, type);
        return ResponseEntity.ok("User type updated successfully");
    }

    @PutMapping("/{id}/username")
    public ResponseEntity<?> changeUsername(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String username = request.get("username");
        userService.changeUsername(userDetails, id, username);

        // Re-issue token if user is changing their own username
        String newToken = null;
        if (userDetails.getUser().getId().equals(id)) {
            newToken = jwtUtil.generateToken(id.toString());
        }

        final String finalToken = newToken;
        return ResponseEntity.ok(new java.util.HashMap<String, String>() {{
            put("message", "Username updated successfully");
            if (finalToken != null) {
                put("token", finalToken);
            }
        }});
    }

    @PutMapping("/{id}/birthdate")
    public ResponseEntity<?> changeBirthdate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String birthdate = request.get("birthdate");
        userService.changeBirthdate(userDetails, id, birthdate);
        return ResponseEntity.ok("Birthdate updated successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        userService.deleteUser(userDetails, id);
        return ResponseEntity.ok("User deleted successfully");
    }
}