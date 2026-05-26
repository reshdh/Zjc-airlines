package com.example.demo.dto;

/**
 * 改签请求体
 */
public class ChangeBookingRequest {

    /**
     * 新航班 ID（必填）
     */
    private Long newFlightId;

    /**
     * 新舱位（选填，不填则沿用原订单舱位）
     */
    private String newCabinClass;

    /**
     * 新票数（选填，不填则沿用原订单票数）
     */
    private Integer newTicketCount;

    /**
     * 改签原因（选填）
     */
    private String changeReason;

    public Long getNewFlightId() {
        return newFlightId;
    }

    public void setNewFlightId(Long newFlightId) {
        this.newFlightId = newFlightId;
    }

    public String getNewCabinClass() {
        return newCabinClass;
    }

    public void setNewCabinClass(String newCabinClass) {
        this.newCabinClass = newCabinClass;
    }

    public Integer getNewTicketCount() {
        return newTicketCount;
    }

    public void setNewTicketCount(Integer newTicketCount) {
        this.newTicketCount = newTicketCount;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }
}



