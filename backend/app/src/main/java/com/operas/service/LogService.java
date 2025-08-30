package com.operas.service;

import com.operas.model.Log;
import com.operas.model.User;
import com.operas.repository.LogRepository;
import com.operas.repository.UserRepository;
import com.operas.dto.LogDto;
import com.operas.exceptions.BadRequestException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class LogService {

    private final LogRepository logRepository;
    private final UserRepository userRepository;

    @Autowired
    public LogService(LogRepository logRepository, UserRepository userRepository) {
        this.logRepository = logRepository;
        this.userRepository = userRepository;
    }

    public Log createLog(Long userId, Log log) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found with id: " + userId));
        log.setUser(user);
        return logRepository.save(log);
    }
    
    public Page<LogDto> getPaginatedLogs(User user, int page, int size) {
        if (user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only Knowledgers can access logs");
        }
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Log> logs = logRepository.findAllByOrderByTimestampDesc(pageable);
        
        return logs.map(LogDto::fromEntity);
    }
    
    public long getTotalLogsCount(User user) {
        if (user.getType() != User.UserType.KNOWLEDGER) {
            throw new BadRequestException("Only Knowledgers can access logs");
        }
        
        return logRepository.count();
    }
}
