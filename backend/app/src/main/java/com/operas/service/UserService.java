package com.operas.service;

import java.util.Optional;
import java.util.List;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.operas.model.User;
import com.operas.dto.UserDto;
import com.operas.repository.UserRepository;
import com.operas.security.CustomUserDetails;
import com.operas.exceptions.UsernameAlreadyExistsException;
import com.operas.exceptions.UserNotFoundException;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User registerUser(User user) {
        // Check if username already exists
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new UsernameAlreadyExistsException("Username already exists");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }
    
    public User registerUser(User user, String onesignalId) {
        // Check if username already exists
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new UsernameAlreadyExistsException("Username already exists");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Set OneSignal ID if provided
        if (onesignalId != null && !onesignalId.trim().isEmpty()) {
            List<String> onesignalIds = new ArrayList<>();
            onesignalIds.add(onesignalId);
            user.setOnesignalId(onesignalIds);
        }
        
        return userRepository.save(user);
    }
    
    public void updateOneSignalId(Long userId, String onesignalId) {
        if (onesignalId == null || onesignalId.trim().isEmpty()) {
            return;
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        List<String> onesignalIds = user.getOnesignalId();
        if (onesignalIds == null) {
            onesignalIds = new ArrayList<>();
        }
        
        // Add new OneSignal ID if not already present
        if (!onesignalIds.contains(onesignalId)) {
            onesignalIds.add(onesignalId);
            user.setOnesignalId(onesignalIds);
            userRepository.save(user);
        }
    }
    
    public Optional<User> findByUsername(String username){
        return userRepository.findByUsername(username);
    }
    
    public Iterable<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .toList();
    }

    public UserDto getCurrentUser(CustomUserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new UserNotFoundException("The user does not exist"));
        return UserDto.fromEntity(user);
    }
}