package com.operas.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.operas.model.User;
import com.operas.repository.UserRepository;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User registerUser(User user) {
        // Check if username already exists
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        // Set default type if not provided
        if (user.getType() == null || user.getType().isEmpty()) {
            user.setType("USER");
        }
        return userRepository.save(user);
    }
    
    public Optional<User> findByUsername(String username){
        return userRepository.findByUsername(username);
    }
}