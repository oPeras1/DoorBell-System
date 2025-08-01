package com.operas.service;

import com.operas.model.Log;
import com.operas.model.User;
import com.operas.repository.LogRepository;
import com.operas.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LogService {

    private final LogRepository logRepository;
    private final UserRepository userRepository;

    @Autowired
    public LogService(LogRepository logRepository, UserRepository userRepository) {
        this.logRepository = logRepository;
        this.userRepository = userRepository;
    }

    public List<Log> getAllLogs() {
        return logRepository.findAll();
    }

    public Optional<Log> getLogById(Long id) {
        return logRepository.findById(id);
    }

    public Optional<Log> getLogByMessage(String message) {
        return logRepository.findByMessage(message);
    }

    public Optional<Log> getLogByUserId(Long userId) {
        return logRepository.findByUser_Id(userId);
    }

    public Log createLog(Long userId, Log log) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        log.setUser(user);
        return logRepository.save(log);
    }
}
