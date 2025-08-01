package com.operas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "logs")
public class Log {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // the user who created the log (should be the User entity)
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @NotBlank(message = "Message is required")
    @Size(min = 4, message = "Message must be at least 4 characters")
    @Column(nullable = false)
    private String message;

    // Add a logtype field
    @Column(nullable = false)
    private String logType = "INFO"; // Default log type

    public Log(String message, User user) {
        this.message = message;
        this.user = user;
    }

    public Log(String message, User user, String logType) {
        this.message = message;
        this.user = user;
        this.logType = logType;
    }
}