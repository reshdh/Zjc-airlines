package com.example.demo.repository;

import com.example.demo.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingSeatRepository extends JpaRepository<BookingSeat, Long> {

    interface CabinOccupiedSummary {
        String getCabinClass();
        Long getOccupiedSeats();
    }
    
    List<BookingSeat> findByBookingId(Long bookingId);
    
    List<BookingSeat> findBySeatId(Long seatId);
    
    boolean existsBySeatId(Long seatId);
    
    @Query("SELECT COUNT(bs) > 0 FROM BookingSeat bs WHERE bs.seat.id = :seatId AND bs.booking.status != 'CANCELED'")
    boolean isSeatOccupied(@Param("seatId") Long seatId);

    @Query("SELECT bs.seat.id FROM BookingSeat bs " +
            "WHERE bs.seat.flight.id = :flightId " +
            "AND bs.seat.cabinClass = :cabinClass " +
            "AND bs.booking.status != 'CANCELED'")
    List<Long> findOccupiedSeatIds(@Param("flightId") Long flightId, @Param("cabinClass") String cabinClass);

    @Query("SELECT COUNT(bs) FROM BookingSeat bs " +
            "WHERE bs.seat.flight.id = :flightId " +
            "AND bs.seat.cabinClass = :cabinClass " +
            "AND bs.booking.status != 'CANCELED'")
    long countOccupiedSeats(@Param("flightId") Long flightId, @Param("cabinClass") String cabinClass);

    @Query("SELECT bs.seat.cabinClass AS cabinClass, COUNT(bs) AS occupiedSeats " +
            "FROM BookingSeat bs " +
            "WHERE bs.seat.flight.id = :flightId " +
            "AND bs.booking.status != 'CANCELED' " +
            "GROUP BY bs.seat.cabinClass")
    List<CabinOccupiedSummary> summarizeOccupiedSeats(@Param("flightId") Long flightId);
    
    @Query("SELECT COUNT(bs) FROM BookingSeat bs " +
            "WHERE bs.seat.flight.id = :flightId " +
            "AND bs.booking.status != 'CANCELED'")
    long countActiveSeatBindings(@Param("flightId") Long flightId);
}

