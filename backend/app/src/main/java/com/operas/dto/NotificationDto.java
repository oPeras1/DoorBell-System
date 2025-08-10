package com.operas.dto;

import com.operas.model.Notification;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private String title;
    private String message;
    private List<Long> userIds;
    private Notification.NotificationType type;
    private Long partyId; // optional, only for type PARTY
}
