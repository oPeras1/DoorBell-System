package com.operas.service;

import com.operas.model.EnvironmentData;
import com.operas.repository.EnvironmentDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StatisticsService {

    @Autowired
    private EnvironmentDataRepository environmentDataRepository;

    public List<EnvironmentData> getRecentEnvironmentData(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return environmentDataRepository.findByCreatedAtAfterOrderByCreatedAtAsc(since);
    }
}
