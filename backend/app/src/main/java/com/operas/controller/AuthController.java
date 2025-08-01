package com.operas.controller;

import com.operas.dto.AuthRequest;
import com.operas.dto.AuthResponse;
import com.operas.dto.UserDto;
import com.operas.model.User;
import com.operas.security.JwtUtil;
import com.operas.service.UserService;
import com.operas.exceptions.WrongCredentialsException;

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
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        userService.registerUser(user);
        return ResponseEntity.ok("User registered successfully");
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody AuthRequest authRequest) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );
            String token = jwtUtil.generateToken(authRequest.getUsername());
            User user = userService.findByUsername(authRequest.getUsername()).orElseThrow();
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
