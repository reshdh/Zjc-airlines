package com.example.demo.dto;

import java.util.List;

public class SeatSelectionResponse {
    private List<String> availableColumns; // 可用列号列表，如 ["A", "B", "C", "D"]
    private List<ColumnAvailability> columnAvailability; // 每列的可用座位数
    private List<String> assignedSeats; // 分配的实际座位号，如 ["4A", "5B"]
    private List<String> unavailableColumns; // 已满的列号（如果选择已满列）

    public SeatSelectionResponse() {
    }

    public List<String> getAvailableColumns() {
        return availableColumns;
    }

    public void setAvailableColumns(List<String> availableColumns) {
        this.availableColumns = availableColumns;
    }

    public List<ColumnAvailability> getColumnAvailability() {
        return columnAvailability;
    }

    public void setColumnAvailability(List<ColumnAvailability> columnAvailability) {
        this.columnAvailability = columnAvailability;
    }

    public List<String> getAssignedSeats() {
        return assignedSeats;
    }

    public void setAssignedSeats(List<String> assignedSeats) {
        this.assignedSeats = assignedSeats;
    }

    public List<String> getUnavailableColumns() {
        return unavailableColumns;
    }

    public void setUnavailableColumns(List<String> unavailableColumns) {
        this.unavailableColumns = unavailableColumns;
    }

    public static class ColumnAvailability {
        private String column; // 列号，如 "A", "B"
        private Long availableCount; // 可用座位数

        public ColumnAvailability() {
        }

        public ColumnAvailability(String column, Long availableCount) {
            this.column = column;
            this.availableCount = availableCount;
        }

        public String getColumn() {
            return column;
        }

        public void setColumn(String column) {
            this.column = column;
        }

        public Long getAvailableCount() {
            return availableCount;
        }

        public void setAvailableCount(Long availableCount) {
            this.availableCount = availableCount;
        }
    }
}






