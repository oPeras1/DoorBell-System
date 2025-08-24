package com.operas.controller;

import com.operas.dto.AuthRequest;
import com.operas.dto.AuthResponse;
import com.operas.dto.UserDto;
import com.operas.model.User;
import com.operas.model.Log;
import com.operas.security.JwtUtil;
import com.operas.service.UserService;
import com.operas.service.LogService;
import com.operas.service.NotificationService;
import com.operas.service.KnowledgerService;
import com.operas.exceptions.WrongCredentialsException;
import com.operas.exceptions.UserNotFoundException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.BadCredentialsException;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private UserService userService;

    @Autowired
    private LogService logService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private KnowledgerService knowledgerService;
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody AuthRequest authRequest) {
        if (knowledgerService.isRegistrationBlocked()) {
            throw new com.operas.exceptions.BadRequestException("User registration is currently blocked");
        }
        User user = new User();
        user.setUsername(authRequest.getUsername());
        user.setPassword(authRequest.getPassword());
        user.setBirthdate(authRequest.getBirthdate());
        
        userService.registerUser(user, authRequest.getOnesignalId());

        logService.createLog(user.getId(), new Log("User registered: " + user.getUsername(), user, "REGISTRATION"));
        
        notificationService.sendWelcomeNotification(user);
        
        return ResponseEntity.ok("User registered successfully");
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody AuthRequest authRequest) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );
            
            User user = userService.findByUsername(authRequest.getUsername())
                .orElseThrow(() -> new UserNotFoundException("User not found: " + authRequest.getUsername()));
            String token = jwtUtil.generateToken(user.getId().toString());
            
            // Update OneSignal ID if provided
            if (authRequest.getOnesignalId() != null) {
                userService.updateOneSignalId(user.getId(), authRequest.getOnesignalId());
                user = userService.findByUsername(authRequest.getUsername())
                    .orElseThrow(() -> new UserNotFoundException("User not found: " + authRequest.getUsername()));
            }

            logService.createLog(user.getId(), new Log("User logged in: " + authRequest.getUsername(), user, "LOGIN"));
            
            return ResponseEntity.ok(new AuthResponse(token, UserDto.fromEntity(user)));
        } catch (BadCredentialsException e) {
            throw new WrongCredentialsException("Username or password incorrect");
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(HttpServletRequest request, HttpServletResponse response) {
        // For stateless JWT, logout is managed client-side by discarding the token.
        // Alternatively, a token blacklist could be implemented.
        return ResponseEntity.ok("Logged out successfully");
    }
}
