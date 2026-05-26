package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonGetter;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "flights")
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String flightNumber;

    @Column(nullable = false, length = 50)
    private String aircraftType;

    @Column(nullable = false, length = 50)
    private String origin;

    @Column(nullable = false, length = 50)
    private String destination;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false)
    private LocalDateTime arrivalTime;

    @Column(length = 500)
    private String remarks;

    @OneToMany(mappedBy = "flight", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"flight"})  // 避免循环引用
    private List<FlightSeat> seats = new ArrayList<>();
    
    // 临时座位列表，用于存储从新座位系统加载的数据，不会被持久化
    @Transient
    private List<FlightSeat> transientSeats = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Flight() {
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFlightNumber() {
        return flightNumber;
    }

    public void setFlightNumber(String flightNumber) {
        this.flightNumber = flightNumber;
    }

    public String getAircraftType() {
        return aircraftType;
    }

    public void setAircraftType(String aircraftType) {
        this.aircraftType = aircraftType;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public LocalDateTime getDepartureTime() {
        return departureTime;
    }

    public void setDepartureTime(LocalDateTime departureTime) {
        this.departureTime = departureTime;
    }

    public LocalDateTime getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(LocalDateTime arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public List<FlightSeat> getSeats() {
        if (seats == null) {
            seats = new ArrayList<>();
        }
        return seats;
    }

    public void setSeats(List<FlightSeat> seats) {
        this.seats = new ArrayList<>();
        if (seats != null) {
            for (FlightSeat seat : seats) {
                if (seat != null) {
                    seat.setFlight(this);
                    this.seats.add(seat);
                }
            }
        }
    }

    public List<FlightSeat> getTransientSeats() {
        return transientSeats;
    }

    public void setTransientSeats(List<FlightSeat> transientSeats) {
        this.transientSeats = transientSeats;
    }
    
    /**
     * 获取座位列表（优先返回临时座位，如果没有则返回持久化的座位）
     * 用于前端兼容性，JSON 序列化时使用此方法
     */
    @JsonGetter("seats")
    public List<FlightSeat> getSeatsForJson() {
        // 如果有临时座位（从新系统加载），返回临时座位
        if (transientSeats != null && !transientSeats.isEmpty()) {
            return transientSeats;
        }
        // 否则返回持久化的座位（从旧系统）
        return seats != null ? seats : new ArrayList<>();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
