package com.operas.repository;

import com.operas.model.PasswordResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {
    List<PasswordResetRequest> findByStatusOrderByCreatedAtDesc(PasswordResetRequest.RequestStatus status);
    Optional<PasswordResetRequest> findByUsernameAndStatus(String username, PasswordResetRequest.RequestStatus status);
    List<PasswordResetRequest> findByUsernameOrderByCreatedAtDesc(String username);
    List<PasswordResetRequest> findByUsernameAndStatusOrderByCreatedAtDesc(String username, PasswordResetRequest.RequestStatus status);
}
