package com.operas.dto;

import com.operas.model.User;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserDto {
    private String username;
    private User.UserType type;

    public static UserDto fromEntity(User user) {
        return new UserDto(user.getUsername(), user.getType());
    }
}