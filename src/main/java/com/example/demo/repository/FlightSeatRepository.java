package com.example.demo.repository;

import com.example.demo.entity.FlightSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlightSeatRepository extends JpaRepository<FlightSeat, Long> {
    
    List<FlightSeat> findByFlightId(Long flightId);
    
    Optional<FlightSeat> findByFlightIdAndCabinClass(Long flightId, String cabinClass);
    
    List<FlightSeat> findByFlightIdAndRemainingSeatsGreaterThan(Long flightId, Integer seats);

    void deleteByFlightId(Long flightId);

    void deleteByFlightIdIn(List<Long> flightIds);
}



