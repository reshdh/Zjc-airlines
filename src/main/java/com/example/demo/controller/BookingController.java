package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.ChangeBookingRequest;
import com.example.demo.dto.ChangePriceResponse;
import com.example.demo.entity.Booking;
import com.example.demo.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<Booking>> createBooking(@RequestBody BookingRequest request) {
        try {
            Booking booking = bookingService.createBooking(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("预订成功", booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Booking>>> getAllBookings() {
        try {
            List<Booking> bookings = bookingService.getAllBookings();
            return ResponseEntity.ok(ApiResponse.success(bookings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<Booking>>> getRecentBookings(
            @RequestParam(defaultValue = "6") int limit) {
        try {
            List<Booking> bookings = bookingService.getRecentBookings(limit);
            return ResponseEntity.ok(ApiResponse.success(bookings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<Booking>> getBookingById(@PathVariable Long id) {
        try {
            Booking booking = bookingService.getBookingById(id);
            return ResponseEntity.ok(ApiResponse.success(booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId:\\d+}")
    public ResponseEntity<ApiResponse<List<Booking>>> getUserBookings(@PathVariable Long userId) {
        try {
            List<Booking> bookings = bookingService.getUserBookings(userId);
            return ResponseEntity.ok(ApiResponse.success(bookings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/flight/{flightId:\\d+}")
    public ResponseEntity<ApiResponse<List<Booking>>> getFlightBookings(@PathVariable Long flightId) {
        try {
            List<Booking> bookings = bookingService.getFlightBookings(flightId);
            return ResponseEntity.ok(ApiResponse.success(bookings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Booking>> updateBookingStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            Booking booking = bookingService.updateBookingStatus(id, status);
            return ResponseEntity.ok(ApiResponse.success("状态更新成功", booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(@PathVariable Long id) {
        try {
            bookingService.deleteBooking(id);
            return ResponseEntity.ok(ApiResponse.success("删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<Booking>> payPendingBooking(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            if (userId == null) {
                throw new RuntimeException("缺少用户信息");
            }
            Booking booking = bookingService.payPendingBooking(id, userId);
            return ResponseEntity.ok(ApiResponse.success("支付成功", booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Booking>> cancelPendingBooking(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            if (userId == null) {
                throw new RuntimeException("缺少用户信息");
            }
            Booking booking = bookingService.cancelPendingBooking(id, userId);
            return ResponseEntity.ok(ApiResponse.success("取消成功", booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/refund-request")
    public ResponseEntity<ApiResponse<Booking>> requestRefund(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            Object userObj = request.get("userId");
            if (userObj == null) {
                throw new RuntimeException("缺少用户信息");
            }
            Long userId = userObj instanceof Number
                    ? ((Number) userObj).longValue()
                    : Long.valueOf(userObj.toString());
            Object reasonObj = request.get("reason");
            String reason = reasonObj != null ? reasonObj.toString() : null;
            Booking booking = bookingService.requestRefund(id, userId, reason);
            return ResponseEntity.ok(ApiResponse.success("退票申请已提交", booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/refund-review")
    public ResponseEntity<ApiResponse<Booking>> reviewRefund(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            Object approveObj = request.get("approve");
            if (approveObj == null) {
                throw new RuntimeException("缺少审核结果");
            }
            boolean approve = Boolean.parseBoolean(approveObj.toString());
            String reason = request.get("reason") != null ? request.get("reason").toString() : null;
            Booking booking = bookingService.reviewRefund(id, approve, reason);
            return ResponseEntity.ok(ApiResponse.success(approve ? "退票已通过" : "已驳回退票", booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/change/check")
    public ResponseEntity<ApiResponse<Boolean>> checkCanChange(
            @PathVariable Long id,
            @RequestParam Long userId) {
        try {
            boolean canChange = bookingService.canChangeBooking(id, userId);
            return ResponseEntity.ok(ApiResponse.success(canChange));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/change/price")
    public ResponseEntity<ApiResponse<ChangePriceResponse>> calculateChangePrice(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestBody ChangeBookingRequest request) {
        try {
            ChangePriceResponse priceInfo = bookingService.calculateChangePrice(id, userId, request);
            return ResponseEntity.ok(ApiResponse.success(priceInfo));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/change")
    public ResponseEntity<ApiResponse<Booking>> changeBooking(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestBody ChangeBookingRequest request) {
        try {
            Booking booking = bookingService.changeBooking(id, userId, request);
            return ResponseEntity.ok(ApiResponse.success("改签成功", booking));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}

