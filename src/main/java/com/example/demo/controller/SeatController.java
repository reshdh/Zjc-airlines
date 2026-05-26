package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.SeatSelectionRequest;
import com.example.demo.dto.SeatSelectionResponse;
import com.example.demo.service.SeatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*")
public class SeatController {

    @Autowired
    private SeatService seatService;

    /**
     * 获取航班的可用座位列信息
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<SeatSelectionResponse>> getAvailableSeatColumns(
            @RequestParam Long flightId,
            @RequestParam String cabinClass) {
        try {
            SeatSelectionResponse response = seatService.getAvailableSeatColumns(flightId, cabinClass);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 选择座位（根据列号自动分配排号）
     */
    @PostMapping("/select")
    public ResponseEntity<ApiResponse<SeatSelectionResponse>> selectSeats(
            @RequestBody SeatSelectionRequest request) {
        try {
            SeatSelectionResponse response = seatService.selectSeats(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}






