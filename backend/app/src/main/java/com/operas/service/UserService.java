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
import com.operas.exceptions.BadRequestException;

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
    
    public void removeOneSignalId(Long userId, String onesignalId) {
        if (onesignalId == null || onesignalId.trim().isEmpty()) {
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        List<String> onesignalIds = user.getOnesignalId();
        if (onesignalIds != null && onesignalIds.contains(onesignalId)) {
            onesignalIds.remove(onesignalId);
            user.setOnesignalId(onesignalIds);
            userRepository.save(user);
        }
    }
    
    public Optional<User> findByUsername(String username){
        return userRepository.findByUsername(username);
    }
    
    public Iterable<UserDto> getAllUsers(CustomUserDetails userDetails) {
        return userRepository.findAll().stream()
                .map(user -> UserDto.fromEntity(user, userDetails.getUser().getType()))
                .toList();
    }

    public UserDto getCurrentUser(CustomUserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new UserNotFoundException("The user does not exist"));
        return UserDto.fromEntity(user, user.getType());
    }

    public void updateMuted(CustomUserDetails userDetails, Long targetId, Boolean muted) {
        if (muted == null)
            throw new BadRequestException("Muted value required");
        if (targetId == null)
            throw new BadRequestException("Target user id required");
        User requester = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        if (requester.getType() != User.UserType.KNOWLEDGER)
            throw new BadRequestException("Only Knowledger can update muted status");
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new UserNotFoundException("Target user not found"));
        if (target.getType() == User.UserType.KNOWLEDGER)
            throw new BadRequestException("Cannot update muted status of another Knowledger");
        target.setMuted(muted);
        userRepository.save(target);
    }

    public void changeStatus(CustomUserDetails userDetails, String status) {
        if (status == null)
            throw new BadRequestException("Status required");
        User user = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        try {
            User.UserStatus newStatus = User.UserStatus.valueOf(status);
            user.setStatus(newStatus);
            userRepository.save(user);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status value");
        }
    }

    public void changeType(CustomUserDetails userDetails, Long id, String type) {
        if (type == null)
            throw new BadRequestException("Type required");
        User requester = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        if (requester.getType() != User.UserType.KNOWLEDGER)
            throw new BadRequestException("Only Knowledger can change user type");
        User target = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Target user not found"));
        if (target.getType() == User.UserType.KNOWLEDGER)
            throw new BadRequestException("Cannot change type of another Knowledger");
        try {
            User.UserType newType = User.UserType.valueOf(type);
            target.setType(newType);
            userRepository.save(target);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid type value");
        }
    }

    public void changeUsername(CustomUserDetails userDetails, Long id, String username) {
        if (username == null || username.trim().isEmpty() || username.length() < 4 || username.length() > 14)
            throw new BadRequestException("Username required with length between 4-14 characters");
        User requester = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        User target = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Target user not found"));
        boolean isSelf = requester.getId().equals(target.getId());
        boolean isKnowledger = requester.getType() == User.UserType.KNOWLEDGER;
        if (!isSelf && !isKnowledger)
            throw new BadRequestException("Only Knowledger or the user itself can change username");
        if (userRepository.findByUsername(username).isPresent())
            throw new UsernameAlreadyExistsException("Username already exists");
        target.setUsername(username);
        userRepository.save(target);
    }

    public void changeBirthdate(CustomUserDetails userDetails, Long id, String birthdate) {
        if (birthdate == null || birthdate.trim().isEmpty())
            throw new IllegalArgumentException("Birthdate required");
        User requester = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        User target = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Target user not found"));
        boolean isSelf = requester.getId().equals(target.getId());
        boolean isKnowledger = requester.getType() == User.UserType.KNOWLEDGER;
        if (!isSelf && !isKnowledger)
            throw new BadRequestException("Only Knowledger or the user itself can change birthdate");
        try {
            target.setBirthdate(java.time.LocalDate.parse(birthdate));
            userRepository.save(target);
        } catch (Exception e) {
            throw new BadRequestException("Invalid birthdate format (expected yyyy-MM-dd)");
        }
    }

    public UserDto getUserById(CustomUserDetails userDetails, Long id) {
        User requester = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        User target = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Requested user not found"));
        
        UserDto dto = UserDto.fromEntity(target, requester.getType());
        if (requester.getId() == target.getId()) {
            dto.setMuted(target.isMuted());
            dto.setStatus(target.getStatus());
        }

        return dto;
    }
}