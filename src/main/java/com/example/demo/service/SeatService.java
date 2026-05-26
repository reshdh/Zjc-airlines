package com.example.demo.service;

import com.example.demo.dto.SeatSelectionRequest;
import com.example.demo.dto.SeatSelectionResponse;
import com.example.demo.entity.Flight;
import com.example.demo.entity.Seat;
import com.example.demo.repository.BookingSeatRepository;
import com.example.demo.repository.FlightRepository;
import com.example.demo.repository.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SeatService {

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private BookingSeatRepository bookingSeatRepository;

    /**
     * 获取航班的可用座位列信息
     */
    public SeatSelectionResponse getAvailableSeatColumns(Long flightId, String cabinClass) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("航班不存在"));

        // 获取所有列号（包括已占用的，因为用户可以选择已满列）
        List<Seat> allSeats = seatRepository.findByFlightIdAndCabinClass(flightId, cabinClass);
        Set<String> allColumns = allSeats.stream()
                .map(Seat::getSeatColumn)
                .collect(Collectors.toCollection(() -> new TreeSet<>()));
        List<String> availableColumns = new ArrayList<>(allColumns);

        Set<Long> occupiedSeatIds = loadOccupiedSeatIds(flightId, cabinClass);

        Map<String, Long> availableCountMap = new HashMap<>();
        for (Seat seat : allSeats) {
            String column = seat.getSeatColumn();
            availableCountMap.putIfAbsent(column, 0L);
            boolean seatAvailable = Boolean.TRUE.equals(seat.getIsAvailable()) && !occupiedSeatIds.contains(seat.getId());
            if (seatAvailable) {
                availableCountMap.put(column, availableCountMap.get(column) + 1);
            }
        }

        List<SeatSelectionResponse.ColumnAvailability> columnAvailability = availableColumns.stream()
                .map(column -> new SeatSelectionResponse.ColumnAvailability(column, availableCountMap.getOrDefault(column, 0L)))
                .collect(Collectors.toList());

        SeatSelectionResponse response = new SeatSelectionResponse();
        response.setAvailableColumns(availableColumns);
        response.setColumnAvailability(columnAvailability);
        return response;
    }

    /**
     * 选择座位（根据列号自动分配排号）
     * 如果选择的列已满，会随机分配其他列的座位
     */
    @Transactional
    public SeatSelectionResponse selectSeats(SeatSelectionRequest request) {
        Flight flight = flightRepository.findById(request.getFlightId())
                .orElseThrow(() -> new RuntimeException("航班不存在"));

        List<String> selectedColumns = request.getSelectedColumns();
        Integer ticketCount = request.getTicketCount();
        String cabinClass = request.getCabinClass();

        List<String> assignedSeats = new ArrayList<>();
        List<String> unavailableColumns = new ArrayList<>();
        List<String> columnsToAssign = new ArrayList<>(selectedColumns);

        Set<Long> occupiedSeatIds = loadOccupiedSeatIds(request.getFlightId(), cabinClass);

        // 验证每个选择的列是否有可用座位（排除已被占用的）
        for (String column : selectedColumns) {
            List<Seat> columnSeats = seatRepository.findAvailableSeatsByColumn(
                    request.getFlightId(), cabinClass, column);
            long availableCount = columnSeats.stream()
                    .filter(seat -> !occupiedSeatIds.contains(seat.getId()))
                    .count();
            if (availableCount == 0) {
                unavailableColumns.add(column);
                columnsToAssign.remove(column);
            }
        }

        // 如果选择的列中有已满的，随机选择其他可用列
        List<String> allAvailableColumns = seatRepository.findAvailableColumns(
                request.getFlightId(), cabinClass);
        
        // 移除已选择的列
        allAvailableColumns.removeAll(selectedColumns);
        
        // 过滤掉已被占用的列
        allAvailableColumns = allAvailableColumns.stream()
                .filter(column -> {
                    List<Seat> columnSeats = seatRepository.findAvailableSeatsByColumn(
                            request.getFlightId(), cabinClass, column);
                    return columnSeats.stream()
                            .anyMatch(seat -> !occupiedSeatIds.contains(seat.getId()));
                })
                .collect(Collectors.toList());
        
        // 如果选择的列已满，用随机列补充
        int neededCount = ticketCount - columnsToAssign.size();
        if (neededCount > 0 && !allAvailableColumns.isEmpty()) {
            Collections.shuffle(allAvailableColumns);
            int addCount = Math.min(neededCount, allAvailableColumns.size());
            for (int i = 0; i < addCount; i++) {
                columnsToAssign.add(allAvailableColumns.get(i));
            }
        }

        // 为每个列分配一个座位（取第一个可用且未被占用的座位）
        for (int i = 0; i < ticketCount && i < columnsToAssign.size(); i++) {
            String column = columnsToAssign.get(i);
            List<Seat> columnSeats = seatRepository.findAvailableSeatsByColumn(
                    request.getFlightId(), cabinClass, column);
            
            // 找到第一个未被占用的座位
            Optional<Seat> availableSeat = columnSeats.stream()
                    .filter(seat -> !occupiedSeatIds.contains(seat.getId()))
                    .findFirst();
            
            if (availableSeat.isPresent()) {
                Seat seat = availableSeat.get();
                assignedSeats.add(seat.getSeatNumber());
                occupiedSeatIds.add(seat.getId());
            } else {
                // 如果这个列也没有座位了，尝试从其他列随机分配
                List<String> remainingColumns = new ArrayList<>(allAvailableColumns);
                remainingColumns.removeAll(columnsToAssign.subList(0, i));
                
                if (!remainingColumns.isEmpty()) {
                    Collections.shuffle(remainingColumns);
                    for (String remainingColumn : remainingColumns) {
                        List<Seat> remainingSeats = seatRepository.findAvailableSeatsByColumn(
                                request.getFlightId(), cabinClass, remainingColumn);
                        Optional<Seat> randomSeat = remainingSeats.stream()
                                .filter(seat -> !occupiedSeatIds.contains(seat.getId()))
                                .findFirst();
                        if (randomSeat.isPresent()) {
                            Seat seat = randomSeat.get();
                            assignedSeats.add(seat.getSeatNumber());
                            occupiedSeatIds.add(seat.getId());
                            columnsToAssign.set(i, remainingColumn);
                            break;
                        }
                    }
                }
            }
        }

        SeatSelectionResponse response = new SeatSelectionResponse();
        response.setAssignedSeats(assignedSeats);
        response.setUnavailableColumns(unavailableColumns);
        return response;
    }

    /**
     * 验证座位是否可用
     */
    public boolean isSeatAvailable(Long flightId, String seatNumber) {
        Optional<Seat> seatOpt = seatRepository.findByFlightIdAndSeatNumber(flightId, seatNumber);
        if (!seatOpt.isPresent()) {
            return false;
        }
        
        Seat seat = seatOpt.get();
        return seat.getIsAvailable() && !isSeatOccupied(seat.getId());
    }

    /**
     * 检查座位是否已被占用（通过 booking_seats 表）
     */
    private boolean isSeatOccupied(Long seatId) {
        return bookingSeatRepository.isSeatOccupied(seatId);
    }

    private Set<Long> loadOccupiedSeatIds(Long flightId, String cabinClass) {
        List<Long> occupied = bookingSeatRepository.findOccupiedSeatIds(flightId, cabinClass);
        if (occupied == null || occupied.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(occupied);
    }
}

