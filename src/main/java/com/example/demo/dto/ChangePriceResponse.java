package com.example.demo.dto;

import java.math.BigDecimal;

/**
 * 改签价格计算结果
 */
public class ChangePriceResponse {

    private BigDecimal newAmount;        // 新订单金额
    private BigDecimal refundAmount;     // 原订单可退金额
    private BigDecimal changeFee;        // 改签手续费
    private BigDecimal priceDifference;  // 需补/退的差价（新金额 + 手续费 - 退款）

    public ChangePriceResponse() {
    }

    public ChangePriceResponse(BigDecimal newAmount,
                               BigDecimal refundAmount,
                               BigDecimal changeFee,
                               BigDecimal priceDifference) {
        this.newAmount = newAmount;
        this.refundAmount = refundAmount;
        this.changeFee = changeFee;
        this.priceDifference = priceDifference;
    }

    public BigDecimal getNewAmount() {
        return newAmount;
    }

    public void setNewAmount(BigDecimal newAmount) {
        this.newAmount = newAmount;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public BigDecimal getChangeFee() {
        return changeFee;
    }

    public void setChangeFee(BigDecimal changeFee) {
        this.changeFee = changeFee;
    }

    public BigDecimal getPriceDifference() {
        return priceDifference;
    }

    public void setPriceDifference(BigDecimal priceDifference) {
        this.priceDifference = priceDifference;
    }
}



