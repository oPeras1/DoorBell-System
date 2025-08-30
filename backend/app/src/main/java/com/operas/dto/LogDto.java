package com.operas.dto;

import com.operas.model.Log;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LogDto {
    private Long id;
    private String message;
    private String username;  // User who performed the action
    private String logType;   // Type of log (INFO, ERROR, etc.)
    private LocalDateTime timestamp;

    public static LogDto fromEntity(Log log) {
        LogDto dto = new LogDto();
        dto.id = log.getId();
        dto.message = log.getMessage();
        dto.username = log.getUser().getUsername();
        dto.logType = log.getLogType();
        dto.timestamp = log.getTimestamp();
        return dto;
    }
}
