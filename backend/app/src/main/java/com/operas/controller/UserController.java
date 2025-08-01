package com.operas.controller;

import com.operas.dto.UserDto;
import com.operas.security.CustomUserDetails;
import com.operas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/")
    public Iterable<UserDto> getAllUsers(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return userService.getAllUsers();
    }

    @GetMapping("/me")
    public UserDto getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return userService.getCurrentUser(userDetails);
    }
}