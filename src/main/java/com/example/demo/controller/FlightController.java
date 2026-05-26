package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.FlightSearchRequest;
import com.example.demo.entity.Flight;
import com.example.demo.service.FlightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins = "*")
public class FlightController {

    @Autowired
    private FlightService flightService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Flight>>> getAllFlights(
            @RequestParam(defaultValue = "false") boolean includePast) {
        try {
            List<Flight> flights = flightService.getAllFlights(includePast);
            return ResponseEntity.ok(ApiResponse.success(flights));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Flight>>> getAvailableFlights(
            @RequestParam(defaultValue = "false") boolean includePast) {
        try {
            List<Flight> flights = flightService.getAvailableFlights(includePast);
            return ResponseEntity.ok(ApiResponse.success(flights));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Flight>> getFlightById(@PathVariable Long id) {
        try {
            Flight flight = flightService.getFlightById(id);
            return ResponseEntity.ok(ApiResponse.success(flight));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/number/{flightNumber}")
    public ResponseEntity<ApiResponse<Flight>> getFlightByNumber(@PathVariable String flightNumber) {
        try {
            Flight flight = flightService.getFlightByNumber(flightNumber);
            return ResponseEntity.ok(ApiResponse.success(flight));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<List<Flight>>> searchFlights(
            @RequestBody(required = false) FlightSearchRequest request,
            @RequestParam(defaultValue = "false") boolean includePast) {
        try {
            // 如果请求体为空，创建一个空对象
            if (request == null) {
                request = new FlightSearchRequest();
            }
            List<Flight> flights = flightService.searchFlights(request, includePast);
            return ResponseEntity.ok(ApiResponse.success(flights));
        } catch (org.springframework.http.converter.HttpMessageNotReadableException e) {
            // JSON 解析错误
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("请求格式错误，请检查日期格式是否正确"));
        } catch (Exception e) {
            e.printStackTrace(); // 打印错误堆栈
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Flight>> createFlight(@RequestBody Flight flight) {
        try {
            Flight createdFlight = flightService.createFlight(flight);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("创建成功", createdFlight));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Flight>> updateFlight(
            @PathVariable Long id,
            @RequestBody Flight flightDetails) {
        try {
            Flight flight = flightService.updateFlight(id, flightDetails);
            return ResponseEntity.ok(ApiResponse.success("更新成功", flight));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFlight(@PathVariable Long id) {
        try {
            flightService.deleteFlight(id);
            return ResponseEntity.ok(ApiResponse.success("删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<Flight>>> getFlightRecommendations(
            @RequestParam(defaultValue = "3") int limit,
            @RequestParam(defaultValue = "false") boolean includePast) {
        try {
            List<Flight> recommendations = flightService.getRecommendedFlights(limit, includePast);
            return ResponseEntity.ok(ApiResponse.success(recommendations));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/cities")
    public ResponseEntity<ApiResponse<List<String>>> searchCities(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            List<String> cities = flightService.searchCities(keyword, limit);
            return ResponseEntity.ok(ApiResponse.success(cities));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}

