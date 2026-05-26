package com.example.demo.dto;

import java.math.BigDecimal;

/**
 * 管理员为用户充值钱包的请求体
 */
public class WalletRechargeRequest {

    private Long userId;
    private BigDecimal amount;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}



