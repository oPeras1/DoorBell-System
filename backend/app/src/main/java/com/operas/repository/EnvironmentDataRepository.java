package com.operas.repository;

import com.operas.model.EnvironmentData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvironmentDataRepository extends JpaRepository<EnvironmentData, Long> {
}