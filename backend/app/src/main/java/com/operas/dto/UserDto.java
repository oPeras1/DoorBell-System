package com.operas.dto;

import com.operas.model.User;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private String username;
    private User.UserType type;
    private LocalDateTime expirationDate;
    private Long id;

    public static UserDto fromEntity(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.type = user.getType();
        dto.expirationDate = user.getExpirationDate();
        return dto;
    }
}