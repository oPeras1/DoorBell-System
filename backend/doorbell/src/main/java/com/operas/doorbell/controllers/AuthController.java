package com.operas.doorbell.controllers;

import com.operas.doorbell.models.User;
import com.operas.doorbell.services.UserService;
import com.operas.doorbell.utils.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (userService.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        User user = userService.registerUser(username, password);
        return ResponseEntity.ok("User registered: " + user.getUsername());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("email");
        String password = request.get("password");

        Optional<User> userOpt = userService.findByUsername(username);
        if (userOpt.isPresent() && userService.checkPassword(userOpt.get(), password)) {
            String token = jwtUtil.generateToken(username);
            System.out.println("Token: " + token);
            return ResponseEntity.ok(Map.of("token", token));
        }

        System.out.println("Invalid credentials");
        System.out.println(username);
        System.out.println(password);
        System.out.println(userOpt.isPresent());

        return ResponseEntity.badRequest().body("Invalid credentials");
    }
}
