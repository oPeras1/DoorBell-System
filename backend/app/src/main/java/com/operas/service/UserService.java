package com.operas.service;

import java.util.Optional;
import java.util.List;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.operas.model.User;
import com.operas.model.Log;
import com.operas.dto.UserDto;
import com.operas.repository.UserRepository;
import com.operas.security.CustomUserDetails;
import com.operas.exceptions.UsernameAlreadyExistsException;
import com.operas.exceptions.UserNotFoundException;
import com.operas.exceptions.BadRequestException;
import com.operas.repository.PartyRepository;
import com.operas.repository.GuestStatusRepository;
import com.operas.repository.NotificationRepository;
import com.operas.repository.LogRepository;
import com.operas.repository.PasswordResetRequestRepository;
import com.operas.model.Party;
import com.operas.exceptions.UserDeletionException;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private GuestStatusRepository guestStatusRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private LogService logService;

    @Autowired
    private PasswordResetRequestRepository passwordResetRequestRepository;
    
    public User registerUser(User user) {
        // Check if username already exists
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new UsernameAlreadyExistsException("Username already exists");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        
        // Log the registration
        logRepository.save(new Log("User registered: " + user.getUsername(), savedUser, "REGISTRATION"));
        
        return savedUser;
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
        
        User savedUser = userRepository.save(user);
        
        // Log the registration
        logRepository.save(new Log("User registered: " + user.getUsername(), savedUser, "REGISTRATION"));
        
        return savedUser;
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
        UserDto dto = UserDto.fromEntity(user, user.getType());
        dto.setStatus(user.getStatus());
        return dto;
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
        
        // Log the muted status change
        String action = muted ? "muted" : "unmuted";
        logRepository.save(new Log("Knowledger " + requester.getUsername() + " " + action + " user: " + target.getUsername(), requester, "USER_MANAGEMENT"));
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
            
            // Log the status change
            logRepository.save(new Log("User " + user.getUsername() + " changed status to " + newStatus, user, "USER_STATUS"));
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
            User.UserType oldType = target.getType();
            target.setType(newType);
            userRepository.save(target);
            
            // Log the type change
            logRepository.save(new Log("Knowledger " + requester.getUsername() + " changed user " + target.getUsername() + " type from " + oldType + " to " + newType, requester, "USER_MANAGEMENT"));
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
            
        String oldUsername = target.getUsername();
        target.setUsername(username);
        userRepository.save(target);
        
        // Log the username change
        if (isSelf) {
            logRepository.save(new Log("User changed username from " + oldUsername + " to " + username, target, "USER_MANAGEMENT"));
        } else {
            logRepository.save(new Log("Knowledger " + requester.getUsername() + " changed user's username from " + oldUsername + " to " + username, requester, "USER_MANAGEMENT"));
        }
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

    @Transactional
    public void deleteUser(CustomUserDetails userDetails, Long userIdToDelete) {
        User requester = userRepository.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new UserNotFoundException("Requester not found"));

        User userToDelete = userRepository.findById(userIdToDelete)
                .orElseThrow(() -> new UserNotFoundException("User to delete not found"));

        boolean isSelf = requester.getId().equals(userIdToDelete);
        boolean isKnowledger = requester.getType() == User.UserType.KNOWLEDGER;

        // Authorization checks
        if (!isSelf && !isKnowledger) {
            throw new UserDeletionException("You can only delete your own account or be a knowledger to delete others.");
        }

        if (isKnowledger && !isSelf && userToDelete.getType() == User.UserType.KNOWLEDGER) {
            throw new UserDeletionException("Knowledgers cannot delete other knowledger accounts.");
        }
        
        // Log the user deletion before deleting the user
        if (isSelf) {
            logService.createLog(requester.getId(), new Log("User deleted their own account: " + userToDelete.getUsername(), requester, "USER_DELETION"));
        } else {
            logService.createLog(requester.getId(), new Log("Knowledger " + requester.getUsername() + " deleted user: " + userToDelete.getUsername(), requester, "USER_DELETION"));
        }

        // Delete related data
        guestStatusRepository.deleteAll(guestStatusRepository.findByUserId(userIdToDelete));

        List<Party> partiesHosted = partyRepository.findByHostId(userIdToDelete);
        partyRepository.deleteAll(partiesHosted);

        notificationRepository.deleteAll(notificationRepository.findByUserIdOrderByCreatedAtDesc(userIdToDelete));

        logRepository.deleteAllByUser_Id(userIdToDelete);

        passwordResetRequestRepository.deleteAllByUsername(userToDelete.getUsername());

        userRepository.delete(userToDelete);
    }
}