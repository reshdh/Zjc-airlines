package com.example.demo.dto;

import java.util.List;

public class SeatSelectionRequest {
    private Long flightId;
    private String cabinClass;
    private Integer ticketCount;
    private List<String> selectedColumns; // 选择的列号，如 ["A", "B"] 或 ["C", "D"]

    public SeatSelectionRequest() {
    }

    public Long getFlightId() {
        return flightId;
    }

    public void setFlightId(Long flightId) {
        this.flightId = flightId;
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

    public List<String> getSelectedColumns() {
        return selectedColumns;
    }

    public void setSelectedColumns(List<String> selectedColumns) {
        this.selectedColumns = selectedColumns;
    }
}






