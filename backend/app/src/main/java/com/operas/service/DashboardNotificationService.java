package com.operas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.operas.dto.NotificationDto;
import com.operas.model.Notification;
import com.operas.repository.NotificationRepository;

@Service
public class DashboardNotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public void sendNotification(NotificationDto notificationDto) {
        System.out.println("DashboardNotificationService: Sending notification to " + notificationDto.getUserIds().size() + " users");
        System.out.println("Notification title: " + notificationDto.getTitle());
        System.out.println("User IDs: " + notificationDto.getUserIds());
        
        for (Long userId : notificationDto.getUserIds()) {
            Notification entity = new Notification();
            entity.setTitle(notificationDto.getTitle());
            entity.setMessage(notificationDto.getMessage());
            entity.setUserId(userId);
            entity.setIsRead(false);
            entity.setType(notificationDto.getType() != null ? notificationDto.getType() : Notification.NotificationType.SYSTEM);
            if (notificationDto.getPartyId() != null) {
                entity.setPartyId(notificationDto.getPartyId());
            }
            
            Notification saved = notificationRepository.save(entity);
            System.out.println("Saved notification with ID: " + saved.getId() + " for user: " + userId);
        }
    }
}