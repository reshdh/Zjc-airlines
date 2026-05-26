package com.example.demo.repository;

import com.example.demo.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {

    interface CabinSeatSummary {
        String getCabinClass();
        Long getTotalSeats();
        Long getAvailableSeats();
    }
    
    List<Seat> findByFlightIdAndCabinClass(Long flightId, String cabinClass);
    
    List<Seat> findByFlightIdAndCabinClassAndIsAvailableTrue(Long flightId, String cabinClass);

    Long countByFlightIdAndCabinClass(Long flightId, String cabinClass);

    Long countByFlightIdAndCabinClassAndIsAvailableTrue(Long flightId, String cabinClass);
    
    @Query("SELECT s FROM Seat s WHERE s.flight.id = :flightId AND s.cabinClass = :cabinClass AND s.seatColumn = :column AND s.isAvailable = true")
    List<Seat> findAvailableSeatsByColumn(@Param("flightId") Long flightId, 
                                          @Param("cabinClass") String cabinClass, 
                                          @Param("column") String column);
    
    @Query("SELECT DISTINCT s.seatColumn FROM Seat s WHERE s.flight.id = :flightId AND s.cabinClass = :cabinClass AND s.isAvailable = true ORDER BY s.seatColumn")
    List<String> findAvailableColumns(@Param("flightId") Long flightId, @Param("cabinClass") String cabinClass);
    
    @Query("SELECT COUNT(s) FROM Seat s WHERE s.flight.id = :flightId AND s.cabinClass = :cabinClass AND s.seatColumn = :column AND s.isAvailable = true")
    Long countAvailableSeatsByColumn(@Param("flightId") Long flightId, 
                                     @Param("cabinClass") String cabinClass, 
                                     @Param("column") String column);
    
    @Query("SELECT s FROM Seat s WHERE s.flight.id = :flightId AND s.cabinClass = :cabinClass AND s.seatColumn = :column AND s.isAvailable = true ORDER BY s.seatRow LIMIT 1")
    Optional<Seat> findFirstAvailableSeatByColumn(@Param("flightId") Long flightId, 
                                                  @Param("cabinClass") String cabinClass, 
                                                  @Param("column") String column);
    
    Optional<Seat> findByFlightIdAndSeatNumber(Long flightId, String seatNumber);

    @Query("SELECT s.cabinClass AS cabinClass, COUNT(s) AS totalSeats, " +
            "SUM(CASE WHEN s.isAvailable = true THEN 1 ELSE 0 END) AS availableSeats " +
            "FROM Seat s WHERE s.flight.id = :flightId GROUP BY s.cabinClass")
    List<CabinSeatSummary> summarizeSeatsByFlight(@Param("flightId") Long flightId);

    void deleteByFlightId(Long flightId);
    
    void deleteByFlightIdIn(List<Long> flightIds);
}






