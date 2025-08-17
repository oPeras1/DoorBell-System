package com.operas.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthRequest {
    private String username;
    private String password;
    private String onesignalId;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthdate;
}
