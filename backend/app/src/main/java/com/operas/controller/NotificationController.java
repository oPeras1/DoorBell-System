package com.operas.controller;

import com.operas.model.Notification;
import com.operas.repository.NotificationRepository;
import com.operas.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        List<Notification> notifications = notificationRepository.findUnreadByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        Notification notification = notificationRepository.findById(id).orElse(null);

        if (notification != null && notification.getUserId().equals(userId)) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }

        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(notifications);
    }
}
