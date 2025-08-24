package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.operas.model.User;
import com.operas.model.PasswordResetRequest;
import com.operas.repository.UserRepository;
import com.operas.repository.PasswordResetRequestRepository;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import com.operas.exceptions.BadRequestException;
import com.operas.exceptions.ResourceNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class KnowledgerService {

    private static volatile boolean maintenanceActive = false;
    private static volatile boolean registrationBlocked = false;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetRequestRepository passwordResetRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public void activateMaintenance(User user) {
        if (user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only knowledger can activate maintenance");
        }
        maintenanceActive = true;
        List<Long> userIds = userRepository.findAll().stream()
            .map(User::getId)
            .collect(Collectors.toList());
        notificationService.sendMaintenanceActivatedNotification(userIds);
    }

    public void deactivateMaintenance(User user) {
        if (user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only knowledger can deactivate maintenance");
        }
        maintenanceActive = false;
        List<Long> userIds = userRepository.findAll().stream()
            .map(User::getId)
            .collect(Collectors.toList());
        notificationService.sendMaintenanceDeactivatedNotification(userIds);
    }

    public boolean isMaintenanceActive() {
        return maintenanceActive;
    }

    public void blockRegistration(User user) {
        if (user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only knowledger can block registration");
        }
        registrationBlocked = true;
        List<Long> knowledgerIds = userRepository.findAll().stream()
            .filter(u -> u.getType() == User.UserType.KNOWLEDGER)
            .map(User::getId)
            .collect(Collectors.toList());
        notificationService.sendRegistrationBlockedNotification(knowledgerIds);
    }

    public void unblockRegistration(User user) {
        if (user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only knowledger can unblock registration");
        }
        registrationBlocked = false;
        List<Long> knowledgerIds = userRepository.findAll().stream()
            .filter(u -> u.getType() == User.UserType.KNOWLEDGER)
            .map(User::getId)
            .collect(Collectors.toList());
        notificationService.sendRegistrationUnblockedNotification(knowledgerIds);
    }

    public boolean isRegistrationBlocked() {
        return registrationBlocked;
    }

    public PasswordResetRequest requestPasswordReset(String username) {
        userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if there's already a pending request
        passwordResetRequestRepository.findByUsernameAndStatus(username, PasswordResetRequest.RequestStatus.PENDING)
            .ifPresent(existingRequest -> {
                throw new BadRequestException("A password reset request is already pending for this user");
            });

        PasswordResetRequest request = new PasswordResetRequest();
        request.setUsername(username);
        request.setStatus(PasswordResetRequest.RequestStatus.PENDING);
        request.setCreatedAt(LocalDateTime.now());
        
        PasswordResetRequest savedRequest = passwordResetRequestRepository.save(request);

        // Notify all knowledgers
        List<Long> knowledgerIds = userRepository.findAll().stream()
            .filter(u -> u.getType() == User.UserType.KNOWLEDGER)
            .map(User::getId)
            .collect(Collectors.toList());
        
        notificationService.sendPasswordResetRequestNotification(username, knowledgerIds);

        return savedRequest;
    }

    public List<PasswordResetRequest> getPendingPasswordResetRequests(User user) {
        if (user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only knowledgers can view password reset requests");
        }
        return passwordResetRequestRepository.findByStatusOrderByCreatedAtDesc(PasswordResetRequest.RequestStatus.PENDING);
    }

    public PasswordResetRequest approvePasswordResetRequest(User knowledger, Long requestId) {
        if (knowledger.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only knowledgers can approve password reset requests");
        }

        PasswordResetRequest request = passwordResetRequestRepository.findById(requestId)
            .orElseThrow(() -> new BadRequestException("Password reset request not found"));

        if (request.getStatus() != PasswordResetRequest.RequestStatus.PENDING) {
            throw new BadRequestException("This request has already been processed");
        }

        request.setStatus(PasswordResetRequest.RequestStatus.APPROVED);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(knowledger.getId());

        return passwordResetRequestRepository.save(request);
    }

    public PasswordResetRequest rejectPasswordResetRequest(User knowledger, Long requestId, String reason) {
        if (knowledger.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only knowledgers can reject password reset requests");
        }

        PasswordResetRequest request = passwordResetRequestRepository.findById(requestId)
            .orElseThrow(() -> new BadRequestException("Password reset request not found"));

        if (request.getStatus() != PasswordResetRequest.RequestStatus.PENDING) {
            throw new BadRequestException("This request has already been processed");
        }

        request.setStatus(PasswordResetRequest.RequestStatus.REJECTED);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(knowledger.getId());
        request.setRejectionReason(reason);

        return passwordResetRequestRepository.save(request);
    }

    public PasswordResetRequest getPasswordResetStatus(String username) {
        return passwordResetRequestRepository.findByUsernameAndStatus(username, PasswordResetRequest.RequestStatus.PENDING)
            .or(() -> passwordResetRequestRepository.findByUsernameOrderByCreatedAtDesc(username).stream().findFirst())
            .orElse(null);
    }

    public void resetPassword(String username, String newPassword) {
        // Fetch all approved requests for this user
        List<PasswordResetRequest> approvedRequests = passwordResetRequestRepository.findByUsernameOrderByCreatedAtDesc(username)
            .stream()
            .filter(r -> r.getStatus() == PasswordResetRequest.RequestStatus.APPROVED)
            .collect(Collectors.toList());

        if (approvedRequests.isEmpty()) {
            throw new BadRequestException("No approved password reset request found for this user");
        }

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new BadRequestException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Remove all processed approved requests for this user
        passwordResetRequestRepository.deleteAll(approvedRequests);
    }
}
