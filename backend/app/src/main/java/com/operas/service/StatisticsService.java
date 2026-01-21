package com.operas.service;

import com.operas.model.EnvironmentData;
import com.operas.repository.EnvironmentDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class StatisticsService {

    @Autowired
    private EnvironmentDataRepository environmentDataRepository;

    public List<EnvironmentData> getRecentEnvironmentData(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<EnvironmentData> allData = environmentDataRepository.findByCreatedAtAfterOrderByCreatedAtAsc(since);

        if (allData.size() <= 100) {
            return allData;
        }

        List<EnvironmentData> result = new ArrayList<>();
        double step = (double) allData.size() / 100;

        for (int i = 0; i < 100; i++) {
            int index = (int) (i * step);
            result.add(allData.get(index));
        }

        return result;
    }
}
