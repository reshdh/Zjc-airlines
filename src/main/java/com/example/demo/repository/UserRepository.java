package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByIdNumber(String idNumber);
    Optional<User> findByPhone(String phone);
    boolean existsByUsername(String username);
    boolean existsByIdNumber(String idNumber);
    boolean existsByPhone(String phone);
    long countByRole(String role);
    long countByStatus(int status);

    @Query("SELECT DATE(u.createdAt) as day, COUNT(u) FROM User u WHERE u.createdAt >= :start GROUP BY DATE(u.createdAt) ORDER BY day ASC")
    List<Object[]> countRegistrationsSince(@Param("start") LocalDateTime start);
}

