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
            notificationRepository.save(entity);
        }
    }
}