package com.example.demo.repository;

import com.example.demo.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByFlightId(Long flightId);
    List<Booking> findByStatus(String status);
    List<Booking> findByStatusAndPaymentDueAtBefore(String status, LocalDateTime paymentDueAt);
    long countByUserIdAndStatusAndUpdatedAtAfter(Long userId, String status, LocalDateTime updatedAt);
    long countByFlightId(Long flightId);
    void deleteByFlightIdIn(List<Long> flightIds);
    
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND b.status = :status")
    List<Booking> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.flight.id = :flightId AND b.status != 'CANCELED'")
    Long countActiveBookingsByFlightId(@Param("flightId") Long flightId);

    List<Booking> findAllByOrderByCreatedAtDesc(Pageable pageable);
}

