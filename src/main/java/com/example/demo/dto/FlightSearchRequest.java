package com.example.demo.dto;

public class FlightSearchRequest {
    private String origin;
    private String destination;

    /**
     * 前端可能传入多种日期格式（yyyy-MM-dd、yyyy/MM/dd 等），
     * 目前搜索逻辑并不会依赖具体日期值，因此保留字符串以避免反序列化报错。
     */
    private String departureDate;

    public FlightSearchRequest() {
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

    public String getDepartureDate() {
        return departureDate;
    }

    public void setDepartureDate(String departureDate) {
        this.departureDate = departureDate;
    }
}

