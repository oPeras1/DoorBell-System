package com.operas.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.operas.dto.NotificationDto;
import com.operas.model.Notification;
import com.operas.model.User;
import com.operas.model.Party;
import com.operas.repository.UserRepository;
import com.operas.repository.PartyRepository;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OneSignalNotificationService {

    @Value("${onesignal.app.id:}")
    private String appId;
    
    @Value("${onesignal.api.key:}")
    private String apiKey;
    
    private final UserRepository userRepository;
    private final PartyRepository partyRepository;
    
    public OneSignalNotificationService(UserRepository userRepository, PartyRepository partyRepository) {
        this.userRepository = userRepository;
        this.partyRepository = partyRepository;
    }

    public void sendNotification(NotificationDto notificationDto) {
        if (appId.isEmpty() || apiKey.isEmpty()) {
            System.out.println("OneSignal not configured, skipping push notification");
            return;
        }
        
        // Get OneSignal IDs for the specified users, filtering by status and notification type
        List<String> oneSignalIds = notificationDto.getUserIds().stream()
            .map(userId -> userRepository.findById(userId).orElse(null))
            .filter(user -> user != null && user.getOnesignalId() != null && !user.getOnesignalId().isEmpty())
            .filter(user -> shouldSendNotification(user, notificationDto))
            .flatMap(user -> user.getOnesignalId().stream())
            .collect(Collectors.toList());
        
        if (!oneSignalIds.isEmpty()) {
            try {
                sendPushNotification(appId, apiKey, oneSignalIds, 
                    notificationDto.getTitle(), notificationDto.getMessage());
            } catch (Exception e) {
                System.err.println("Failed to send push notification: " + e.getMessage());
            }
        }
    }
    
    private boolean shouldSendNotification(User user, NotificationDto notificationDto) {
        // If user is not in DONT_DISTURB mode, always send
        if (user.getStatus() != User.UserStatus.DONT_DISTURB) {
            return true;
        }
        
        // If user is in DONT_DISTURB mode, check exceptions
        Notification.NotificationType type = notificationDto.getType();
        
        // Always send SYSTEM, SECURITY, or VISITOR notifications
        if (type == Notification.NotificationType.SYSTEM || 
            type == Notification.NotificationType.SECURITY || 
            type == Notification.NotificationType.VISITOR) {
            return true;
        }
        
        // For PARTY notifications, check if it's a CLEANING party
        if (type == Notification.NotificationType.PARTY && notificationDto.getPartyId() != null) {
            Party party = partyRepository.findById(notificationDto.getPartyId()).orElse(null);
            if (party != null && party.getType() == Party.PartyType.CLEANING) {
                return true;
            }
        }
        
        // Otherwise, don't send to users in DONT_DISTURB mode
        return false;
    }
    
    public void sendPushNotification(String appId, String apiKey, 
                                   List<String> oneSignalIds, 
                                   String title, String message) throws Exception {
        
        String json = String.format("""
            {
                "app_id": "%s",
                "include_aliases": {
                    "onesignal_id": %s
                },
                "target_channel": "push",
                "headings": {"en": "%s"},
                "contents": {"en": "%s"}
            }
            """, appId, formatIds(oneSignalIds), title, message);
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.onesignal.com/notifications"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Key " + apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        System.out.println("Response: " + response.body());
    }
    
    private String formatIds(List<String> oneSignalIds) {
        return oneSignalIds.stream()
            .map(id -> "\"" + id + "\"")
            .collect(Collectors.joining(", ", "[", "]"));
    }
}