package com.example.demo.dto;

import java.util.List;

public class BookingRequest {
    private Long flightId;
    private Long userId;
    private String cabinClass; // ECONOMY, BUSINESS, FIRST
    private Integer ticketCount;
    private Boolean payLater;
    private List<String> selectedSeatColumns; // 选择的座位列号，如 ["A", "B"] 或 ["C", "D"]（可选）
    private List<PassengerInfo> passengers; // 乘客信息列表（包含姓名/证件/电话）

    public BookingRequest() {
    }

    public Long getFlightId() {
        return flightId;
    }

    public void setFlightId(Long flightId) {
        this.flightId = flightId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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

    public Boolean getPayLater() {
        return payLater;
    }

    public void setPayLater(Boolean payLater) {
        this.payLater = payLater;
    }

    public List<String> getSelectedSeatColumns() {
        return selectedSeatColumns;
    }

    public void setSelectedSeatColumns(List<String> selectedSeatColumns) {
        this.selectedSeatColumns = selectedSeatColumns;
    }

    public List<PassengerInfo> getPassengers() {
        return passengers;
    }

    public void setPassengers(List<PassengerInfo> passengers) {
        this.passengers = passengers;
    }

    public static class PassengerInfo {
        private String name;
        private String idNumber;
        private String phone;

        public PassengerInfo() {
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getIdNumber() {
            return idNumber;
        }

        public void setIdNumber(String idNumber) {
            this.idNumber = idNumber;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }
}

