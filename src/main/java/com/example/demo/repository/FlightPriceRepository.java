package com.example.demo.repository;

import com.example.demo.entity.FlightPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlightPriceRepository extends JpaRepository<FlightPrice, Long> {
    
    List<FlightPrice> findByFlightId(Long flightId);
    
    Optional<FlightPrice> findByFlightIdAndCabinClass(Long flightId, String cabinClass);

    void deleteByFlightId(Long flightId);

    void deleteByFlightIdIn(List<Long> flightIds);
}






