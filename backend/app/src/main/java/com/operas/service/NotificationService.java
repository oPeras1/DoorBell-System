package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.operas.dto.NotificationDto;
import com.operas.model.Notification;
import com.operas.model.User;

import java.util.List;
import java.time.LocalDateTime;

@Service
public class NotificationService {

    @Autowired
    private DashboardNotificationService dashboardNotificationService;
    
    @Autowired
    private OneSignalNotificationService oneSignalNotificationService;

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
        String notificationTitle = "You got an invitation!";
        String formattedDateTime = dateTime.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        String notificationMessage = "Invite to '" + partyName + "' at " + formattedDateTime + ". Check details.";

        NotificationDto notificationDto = new NotificationDto(
            notificationTitle,
            notificationMessage,
            guestUserIds,
            Notification.NotificationType.PARTY,
            partyId
        );
        sendNotification(notificationDto);
    }
    
    public void sendPartyStatusChangedNotification(com.operas.model.Party party, com.operas.model.Party.PartyStatus newStatus, List<Long> userIds) {
        String statusText = switch (newStatus) {
            case SCHEDULED -> "Scheduled";
            case IN_PROGRESS -> "In Progress";
            case COMPLETED -> "Completed";
            case CANCELLED -> "Cancelled";
        };
        String notificationTitle = "Party status updated";
        String notificationMessage = "The party '" + party.getName() + "' is now " + statusText + ".";

        NotificationDto notificationDto = new NotificationDto(
            notificationTitle,
            notificationMessage,
            userIds,
            com.operas.model.Notification.NotificationType.PARTY,
            party.getId()
        );
        sendNotification(notificationDto);
    }
    
    public void sendPartyReminderNotification(com.operas.model.Party party, String reminderType, List<Long> userIds) {
        String notificationTitle;
        String notificationMessage;
        
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

        NotificationDto notificationDto = new NotificationDto(
            notificationTitle,
            notificationMessage,
            userIds,
            Notification.NotificationType.PARTY,
            party.getId()
        );
        sendNotification(notificationDto);
    }
}
