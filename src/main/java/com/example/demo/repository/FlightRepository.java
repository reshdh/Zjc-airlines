package com.example.demo.repository;

import com.example.demo.entity.Flight;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {
    Optional<Flight> findByFlightNumber(String flightNumber);
    List<Flight> findByOriginAndDestination(String origin, String destination);
    List<Flight> findByOrigin(String origin);
    List<Flight> findByDestination(String destination);

    List<Flight> findByOriginContainingIgnoreCaseAndDestinationContainingIgnoreCase(String origin, String destination);
    List<Flight> findByOriginContainingIgnoreCase(String origin);
    List<Flight> findByDestinationContainingIgnoreCase(String destination);

    List<Flight> findByFlightNumberIn(Collection<String> flightNumbers);
    
    @Query("SELECT f FROM Flight f WHERE f.departureTime >= :startTime AND f.departureTime <= :endTime")
    List<Flight> findFlightsByDateRange(@Param("startTime") LocalDateTime startTime, 
                                         @Param("endTime") LocalDateTime endTime);
    
    // 注意：新系统不再使用 Flight.seats 关系，此方法返回所有未来航班
    // 座位可用性通过 seats 表和 booking_seats 表动态计算
    @Query("SELECT f FROM Flight f WHERE f.departureTime >= :now")
    List<Flight> findAvailableFlights(@Param("now") LocalDateTime now);
    
    // 重载方法，兼容旧代码
    default List<Flight> findAvailableFlights() {
        return findAvailableFlights(LocalDateTime.now());
    }

    // 注意：新系统不再使用 Flight.seats 关系，按出发时间排序
    @Query("SELECT f FROM Flight f ORDER BY f.departureTime ASC")
    Page<Flight> findAllByOrderByRemainingSeatsDesc(Pageable pageable);

    @Query(
            value = "SELECT f.* FROM flights f " +
                    "LEFT JOIN bookings b ON b.flight_id = f.id AND b.status != 'CANCELED' " +
                    "GROUP BY f.id " +
                    "ORDER BY COUNT(b.id) DESC, f.departure_time ASC " +
                    "LIMIT :limit",
            nativeQuery = true)
    List<Flight> findTopFlightsByBookingCount(@Param("limit") int limit);

    @Query("SELECT DISTINCT f.origin FROM Flight f WHERE f.origin IS NOT NULL AND (:keyword IS NULL OR LOWER(f.origin) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY f.origin ASC")
    List<String> findDistinctOrigins(@Param("keyword") String keyword);

    @Query("SELECT DISTINCT f.destination FROM Flight f WHERE f.destination IS NOT NULL AND (:keyword IS NULL OR LOWER(f.destination) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY f.destination ASC")
    List<String> findDistinctDestinations(@Param("keyword") String keyword);
    
    // 按照创建时间降序排列（最新的在前面）
    List<Flight> findAllByOrderByCreatedAtDesc();
}

