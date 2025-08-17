package com.operas.dto;

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
public class UserDto {
    private String username;
    private User.UserType type;
    private LocalDateTime expirationDate;
    private Long id;
    private LocalDate birthdate;
    private LocalDateTime createdAt;
    private boolean muted;
    private User.UserStatus status;
    private List<String> onesignalId;

    public static UserDto fromEntity(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.type = user.getType();
        dto.expirationDate = user.getExpirationDate();
        dto.birthdate = user.getBirthdate();
        dto.createdAt = user.getCreatedAt();
        dto.muted = user.isMuted();
        dto.status = user.getStatus();
        dto.onesignalId = user.getOnesignalId();
        return dto;
    }
}