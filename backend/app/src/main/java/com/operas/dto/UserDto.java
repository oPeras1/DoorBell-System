package com.operas.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.operas.model.User;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto {
    private String username;
    private User.UserType type;
    private LocalDateTime expirationDate;
    private Long id;
    private LocalDate birthdate;
    private LocalDateTime createdAt;
    private Boolean muted;
    private User.UserStatus status;
    private List<String> onesignalId;

    public static UserDto fromEntity(User user, User.UserType requesterType) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.type = user.getType();
        dto.birthdate = user.getBirthdate();
        dto.createdAt = user.getCreatedAt();

        if (requesterType == User.UserType.KNOWLEDGER) {
            dto.expirationDate = user.getExpirationDate();
            dto.muted = user.isMuted();
            dto.status = user.getStatus();
            dto.onesignalId = user.getOnesignalId();
        } else {
            dto.expirationDate = null;
            dto.muted = null;
            dto.status = null;
            dto.onesignalId = null;
        }
        return dto;
    }

    public static UserDto fromEntity(User user) {
        // Default to GUEST type if no requester type is provided
        return fromEntity(user, User.UserType.GUEST);
    }
}