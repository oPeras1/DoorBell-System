package com.operas.controller;

import com.operas.dto.UserDto;
import com.operas.security.CustomUserDetails;
import com.operas.service.UserService;
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

    @GetMapping("/")
    public Iterable<UserDto> getAllUsers(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return userService.getAllUsers();
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
}