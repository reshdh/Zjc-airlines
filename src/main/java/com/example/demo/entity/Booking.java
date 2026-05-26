package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "flight_id", nullable = false)
    private Flight flight;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    private String cabinClass; // ECONOMY, BUSINESS, FIRST

    @Column(nullable = false)
    private Integer ticketCount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 20)
    private String status; // e.g. CREATED, PAID, CANCELED

    @Column(name = "order_no", nullable = false, unique = true, length = 50)
    private String orderNo; // 订单号

    @Column(name = "payment_due_at")
    private LocalDateTime paymentDueAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "refund_reason", length = 255)
    private String refundReason;

    @Column(name = "refund_reject_reason", length = 255)
    private String refundRejectReason;

    @Column(name = "urgent_surcharge_rate", precision = 6, scale = 4, nullable = false)
    private BigDecimal urgentSurchargeRate = BigDecimal.ZERO;

    @Column(name = "refund_fee_rate", precision = 6, scale = 4, nullable = false)
    private BigDecimal refundFeeRate = BigDecimal.ZERO;

    @Column(name = "refund_fee_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal refundFeeAmount = BigDecimal.ZERO;

    @Column(name = "original_booking_id")
    private Long originalBookingId; // 原订单ID（改签前的订单）

    @Column(name = "change_fee_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal changeFeeAmount = BigDecimal.ZERO; // 改签手续费

    @Column(name = "change_reason", length = 255)
    private String changeReason; // 改签原因

    @Column(name = "original_flight_id")
    private Long originalFlightId; // 原航班ID（历史记录）

    @Column(name = "original_cabin_class", length = 20)
    private String originalCabinClass; // 原舱位等级（历史记录）

    @Column(name = "original_total_amount", precision = 10, scale = 2)
    private BigDecimal originalTotalAmount; // 原订单总金额（历史记录）

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"booking"})
    private List<BookingSeat> bookingSeats = new ArrayList<>();

    public Booking() {
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        // 自动生成订单号：BK + 日期(YYYYMMDD) + 6位序号
        if (orderNo == null || orderNo.isEmpty()) {
            orderNo = generateOrderNo();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 生成订单号：BK + 日期(YYYYMMDD) + 6位序号
     * 序号基于当前时间戳的纳秒级精度生成，确保唯一性
     */
    private String generateOrderNo() {
        LocalDateTime now = LocalDateTime.now();
        String dateStr = String.format("%04d%02d%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
        // 使用时间戳的毫秒数 + 纳秒数的后几位，确保唯一性
        long timestamp = System.currentTimeMillis();
        long nanoTime = System.nanoTime();
        // 组合时间戳和纳秒时间，取后6位
        int sequence = (int) ((timestamp + nanoTime) % 1000000);
        // 如果序号不足6位，前面补0
        String sequenceStr = String.format("%06d", sequence);
        return "BK" + dateStr + sequenceStr;
    }

    // getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Flight getFlight() {
        return flight;
    }

    public void setFlight(Flight flight) {
        this.flight = flight;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCabinClass() {
        return cabinClass;
    }

    public void setCabinClass(String cabinClass) {
        this.cabinClass = cabinClass;
    }

    public Integer getTicketCount() {
        return ticketCount;
    }

    public void setTicketCount(Integer ticketCount) {
        this.ticketCount = ticketCount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public LocalDateTime getPaymentDueAt() {
        return paymentDueAt;
    }

    public void setPaymentDueAt(LocalDateTime paymentDueAt) {
        this.paymentDueAt = paymentDueAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getRefundReason() {
        return refundReason;
    }

    public void setRefundReason(String refundReason) {
        this.refundReason = refundReason;
    }

    public String getRefundRejectReason() {
        return refundRejectReason;
    }

    public void setRefundRejectReason(String refundRejectReason) {
        this.refundRejectReason = refundRejectReason;
    }

    public BigDecimal getUrgentSurchargeRate() {
        return urgentSurchargeRate;
    }

    public void setUrgentSurchargeRate(BigDecimal urgentSurchargeRate) {
        this.urgentSurchargeRate = urgentSurchargeRate;
    }

    public BigDecimal getRefundFeeRate() {
        return refundFeeRate;
    }

    public void setRefundFeeRate(BigDecimal refundFeeRate) {
        this.refundFeeRate = refundFeeRate;
    }

    public BigDecimal getRefundFeeAmount() {
        return refundFeeAmount;
    }

    public void setRefundFeeAmount(BigDecimal refundFeeAmount) {
        this.refundFeeAmount = refundFeeAmount;
    }

    public Long getOriginalBookingId() {
        return originalBookingId;
    }

    public void setOriginalBookingId(Long originalBookingId) {
        this.originalBookingId = originalBookingId;
    }

    public BigDecimal getChangeFeeAmount() {
        return changeFeeAmount;
    }

    public void setChangeFeeAmount(BigDecimal changeFeeAmount) {
        this.changeFeeAmount = changeFeeAmount;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }

    public Long getOriginalFlightId() {
        return originalFlightId;
    }

    public void setOriginalFlightId(Long originalFlightId) {
        this.originalFlightId = originalFlightId;
    }

    public String getOriginalCabinClass() {
        return originalCabinClass;
    }

    public void setOriginalCabinClass(String originalCabinClass) {
        this.originalCabinClass = originalCabinClass;
    }

    public BigDecimal getOriginalTotalAmount() {
        return originalTotalAmount;
    }

    public void setOriginalTotalAmount(BigDecimal originalTotalAmount) {
        this.originalTotalAmount = originalTotalAmount;
    }

    public List<BookingSeat> getBookingSeats() {
        return bookingSeats;
    }

    public void setBookingSeats(List<BookingSeat> bookingSeats) {
        this.bookingSeats = bookingSeats;
    }
}
