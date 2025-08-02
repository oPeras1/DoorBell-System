package com.operas.dto;

import com.operas.model.User;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class UserDto {
    private String username;
    private User.UserType type;
    private LocalDateTime expirationDate;

    public static UserDto fromEntity(User user) {
        return new UserDto(user.getUsername(), user.getType(), user.getExpirationDate());
    }
}