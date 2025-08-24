package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.operas.model.User;
import com.operas.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import com.operas.exceptions.BadRequestException;

@Service
public class KnowledgerService {

    private static volatile boolean maintenanceActive = false;
    private static volatile boolean registrationBlocked = false;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

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
}
