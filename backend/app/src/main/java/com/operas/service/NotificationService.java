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
}
