package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import com.operas.dto.NotificationDto;
import com.operas.model.Notification;
import com.operas.model.User;
import com.operas.model.Party;
import com.operas.repository.PartyRepository;
import com.operas.repository.UserRepository;

import java.util.List;
import java.time.LocalDateTime;

@Service
public class NotificationService {

    @Autowired
    private DashboardNotificationService dashboardNotificationService;
    
    @Autowired
    private OneSignalNotificationService oneSignalNotificationService;
    
    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @Lazy
    private KnowledgerService knowledgerService;

    public void sendNotification(NotificationDto notificationDto) {
        // Send dashboard notification
        dashboardNotificationService.sendNotification(notificationDto);
        
        // Send push notification if users have OneSignal IDs
        oneSignalNotificationService.sendNotification(notificationDto);
    }
    
    public void sendWelcomeNotification(User user) {
        NotificationDto welcomeNotification = new NotificationDto();
        welcomeNotification.setTitle("Welcome TO THE HOUSE!");
        welcomeNotification.setMessage("Your doorbell account has been created successfully!");
        welcomeNotification.setUserIds(List.of(user.getId()));
        welcomeNotification.setType(Notification.NotificationType.SYSTEM);
        
        sendNotification(welcomeNotification);
    }
    
    public void sendPartyInvitationNotification(String partyName, LocalDateTime dateTime, List<Long> guestUserIds, Long partyId) {
        // Check if it's a cleaning party
        Party party = partyRepository.findById(partyId).orElse(null);
        boolean isCleaning = party != null && party.getType() == Party.PartyType.CLEANING;
        
        String notificationTitle;
        String notificationMessage;
        String formattedDateTime = dateTime.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        
        if (isCleaning) {
            notificationTitle = "🧹 URGENT: Cleaning Schedule!";
            notificationMessage = "MANDATORY cleaning session '" + partyName + "' at " + formattedDateTime + ". Your participation is required!";
        } else {
            notificationTitle = "You got an invitation!";
            notificationMessage = "Invite to '" + partyName + "' at " + formattedDateTime + ". Check details.";
        }

        NotificationDto notificationDto = new NotificationDto(
            notificationTitle,
            notificationMessage,
            guestUserIds,
            Notification.NotificationType.PARTY,
            partyId
        );
        sendNotification(notificationDto);
    }
    
    public void sendPartyStatusChangedNotification(Party party, Party.PartyStatus newStatus, List<Long> userIds) {
        boolean isCleaning = party.getType() == Party.PartyType.CLEANING;
        
        String statusText = switch (newStatus) {
            case SCHEDULED -> isCleaning ? "Scheduled - MANDATORY" : "Scheduled";
            case IN_PROGRESS -> isCleaning ? "IN PROGRESS - JOIN NOW!" : "In Progress";
            case COMPLETED -> isCleaning ? "Completed - Thank you!" : "Completed";
            case CANCELLED -> isCleaning ? "CANCELLED - Check updates" : "Cancelled";
        };
        
        String notificationTitle = isCleaning ? "🧹 CLEANING UPDATE" : "Party status updated";
        String notificationMessage = isCleaning ? 
            "The cleaning session '" + party.getName() + "' is now " + statusText + "." :
            "The party '" + party.getName() + "' is now " + statusText + ".";

        NotificationDto notificationDto = new NotificationDto(
            notificationTitle,
            notificationMessage,
            userIds,
            Notification.NotificationType.PARTY,
            party.getId()
        );
        sendNotification(notificationDto);
    }
    
    public void sendPartyReminderNotification(Party party, String reminderType, List<Long> userIds) {
        boolean isCleaning = party.getType() == Party.PartyType.CLEANING;
        String notificationTitle;
        String notificationMessage;
        
        if (isCleaning) {
            switch (reminderType) {
                case "3_DAYS" -> {
                    notificationTitle = "🧹 CLEANING REMINDER - 3 Days";
                    notificationMessage = "MANDATORY cleaning session '" + party.getName() + "' in 3 days on " + 
                        party.getDateTime().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + ". Prepare your schedule!";
                }
                case "24_HOURS" -> {
                    notificationTitle = "🧹 URGENT: Cleaning Tomorrow!";
                    notificationMessage = "MANDATORY cleaning session '" + party.getName() + "' tomorrow at " + 
                        party.getDateTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + ". Be ready!";
                }
                case "1_HOUR" -> {
                    notificationTitle = "🧹 CLEANING STARTS IN 1 HOUR!";
                    notificationMessage = "MANDATORY cleaning session '" + party.getName() + "' starts in 1 hour! Get your cleaning supplies ready.";
                }
                case "STARTING" -> {
                    notificationTitle = "🧹 CLEANING SESSION STARTED!";
                    notificationMessage = "The cleaning session '" + party.getName() + "' has started! Please join immediately.";
                }
                case "ENDING" -> {
                    notificationTitle = "🧹 Cleaning Session Completed";
                    notificationMessage = "The cleaning session '" + party.getName() + "' has ended. Thank you for your participation!";
                }
                default -> throw new IllegalArgumentException("Unknown reminder type: " + reminderType);
            }
        } else {
            switch (reminderType) {
                case "3_DAYS" -> {
                    notificationTitle = "Party Reminder - 3 Days";
                    notificationMessage = "Don't forget! The party '" + party.getName() + "' is in 3 days on " + 
                        party.getDateTime().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + ".";
                }
                case "24_HOURS" -> {
                    notificationTitle = "Party Reminder - Tomorrow";
                    notificationMessage = "Tomorrow! The party '" + party.getName() + "' is at " + 
                        party.getDateTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + "!";
                }
                case "1_HOUR" -> {
                    notificationTitle = "Party Starting Soon";
                    notificationMessage = "The party '" + party.getName() + "' starts in 1 hour! Time to get ready.";
                }
                case "STARTING" -> {
                    notificationTitle = "Party Started!";
                    notificationMessage = "The party '" + party.getName() + "' has just started! Join the fun.";
                }
                case "ENDING" -> {
                    notificationTitle = "Party Ended";
                    notificationMessage = "The party '" + party.getName() + "' has ended. Hope you had a great time!";
                }
                default -> throw new IllegalArgumentException("Unknown reminder type: " + reminderType);
            }
        }

        NotificationDto notificationDto = new NotificationDto(
            notificationTitle,
            notificationMessage,
            userIds,
            Notification.NotificationType.PARTY,
            party.getId()
        );
        sendNotification(notificationDto);
    }

    public void sendMaintenanceActivatedNotification(List<Long> userIds) {
        NotificationDto notificationDto = new NotificationDto(
            "Maintenance Mode Activated",
            "The system is now in maintenance mode. Door opening is disabled!",
            userIds,
            Notification.NotificationType.SYSTEM,
            null
        );
        sendNotification(notificationDto);
    }

    public void sendMaintenanceDeactivatedNotification(List<Long> userIds) {
        NotificationDto notificationDto = new NotificationDto(
            "Maintenance Mode Deactivated",
            "Maintenance mode ended. Door opening is now enabled again!",
            userIds,
            Notification.NotificationType.SYSTEM,
            null
        );
        sendNotification(notificationDto);
    }

    public void sendRegistrationBlockedNotification(List<Long> knowledgerIds) {
        NotificationDto notificationDto = new NotificationDto(
            "User Registration Blocked",
            "New user registrations have been blocked by a knowledger.",
            knowledgerIds,
            Notification.NotificationType.SYSTEM,
            null
        );
        sendNotification(notificationDto);
    }

    public void sendRegistrationUnblockedNotification(List<Long> knowledgerIds) {
        NotificationDto notificationDto = new NotificationDto(
            "User Registration Unblocked",
            "New user registrations have been unblocked by a knowledger.",
            knowledgerIds,
            Notification.NotificationType.SYSTEM,
            null
        );
        sendNotification(notificationDto);
    }

    public void sendPasswordResetRequestNotification(String username, List<Long> knowledgerIds) {
        NotificationDto notificationDto = new NotificationDto(
            "Password Reset Request",
            "User '" + username + "' has requested a password reset. Please review the request.",
            knowledgerIds,
            Notification.NotificationType.SYSTEM,
            null
        );
        sendNotification(notificationDto);
    }

    public void sendDoorOpenedNotification(User userWhoOpened) {
        boolean isMaintenanceActive = knowledgerService.isMaintenanceActive();
        
        // Get all users first
        List<User> allUsers = userRepository.findAll();
        System.out.println("Total users in database: " + allUsers.size());
        
        List<Long> userIds;
        if (isMaintenanceActive) {
            // In maintenance mode, only notify knowledgers
            userIds = allUsers.stream()
                .filter(u -> {
                    boolean isKnowledger = u.getType() == User.UserType.KNOWLEDGER;
                    boolean isNotSameUser = !u.getId().equals(userWhoOpened.getId());
                    System.out.println("User: " + u.getUsername() + ", Type: " + u.getType() + ", Is Knowledger: " + isKnowledger + ", Not same user: " + isNotSameUser);
                    return isKnowledger && isNotSameUser;
                })
                .map(User::getId)
                .toList();
        } else {
            // Normal mode, notify knowledgers and housers
            userIds = allUsers.stream()
                .filter(u -> {
                    boolean isKnowledgerOrHouser = u.getType() == User.UserType.KNOWLEDGER || u.getType() == User.UserType.HOUSER;
                    boolean isNotSameUser = !u.getId().equals(userWhoOpened.getId());
                    System.out.println("User: " + u.getUsername() + ", Type: " + u.getType() + ", Is K/H: " + isKnowledgerOrHouser + ", Not same user: " + isNotSameUser);
                    return isKnowledgerOrHouser && isNotSameUser;
                })
                .map(User::getId)
                .toList();
        }
        
        System.out.println("Door opened by: " + userWhoOpened.getUsername() + " (ID: " + userWhoOpened.getId() + ")");
        System.out.println("Maintenance active: " + isMaintenanceActive);
        System.out.println("User IDs to notify: " + userIds);
        
        if (!userIds.isEmpty()) {
            NotificationDto notificationDto = new NotificationDto(
                "Door Opened",
                "The door was opened by " + userWhoOpened.getUsername(),
                userIds,
                Notification.NotificationType.DOORBELL,
                null
            );
            System.out.println("Sending notification to " + userIds.size() + " users");
            sendNotification(notificationDto);
        } else {
            System.out.println("No users to notify for door opening");
        }
    }
}
