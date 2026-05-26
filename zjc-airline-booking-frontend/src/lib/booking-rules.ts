/**
 * 预订业务规则常量
 * 这些规则与后端 BookingService 中的规则保持一致
 */

export const BOOKING_RULES = {
  // 紧急窗口（小时内）
  URGENT_WINDOW_HOURS: 12,
  
  // 退票手续费率（起飞12小时内退票收取1%手续费）
  URGENT_REFUND_FEE_RATE: 0.01, // 1%
  
  // 改签规则
  CHANGE: {
    // 改签最少提前小时数
    MIN_HOURS_BEFORE_DEPARTURE: 2,
    // 改签手续费率
    FEE_RATE: 0.05, // 5%
  },
  
  // 紧急加价（起飞12小时内订票加收10%）
  URGENT_SURCHARGE_RATE: 0.10, // 10%
} as const;

/**
 * 获取业务规则说明文本（中文）
 */
export function getBookingRulesText(): string {
  return `【退改签业务规则】

**退票规则：**
- 起飞前12小时内退票：收取订单金额的 ${BOOKING_RULES.URGENT_REFUND_FEE_RATE * 100}% 作为退票手续费
- 起飞前12小时外退票：不收取退票手续费，全额退款

**改签规则：**
- 改签必须在航班起飞前至少 ${BOOKING_RULES.CHANGE.MIN_HOURS_BEFORE_DEPARTURE} 小时进行
- 改签手续费：新订单金额的 ${BOOKING_RULES.CHANGE.FEE_RATE * 100}%（改签手续费率）
- 原订单退款：按退票规则计算（起飞前12小时内退票会扣除 ${BOOKING_RULES.URGENT_REFUND_FEE_RATE * 100}% 手续费）
- 差价计算：新订单金额 + 改签手续费 - 原订单退款 = 需补/退的差价
- 改签后的新订单不能再次改签
- 改签必须选择不同的航班或不同的舱位（不能改签到同一航班的相同舱位）

**紧急加价规则：**
- 起飞前12小时内订票：在原价基础上加收 ${BOOKING_RULES.URGENT_SURCHARGE_RATE * 100}% 作为紧急加价

**订单状态：**
- CREATED：已创建但未支付（需在15分钟内完成支付，否则自动取消）
- PAID：已支付并出票
- REFUND_REVIEW：退票申请审核中
- REFUNDED：已退票
- CANCELED：已取消（超时未支付）
- REFUND_REJECTED：退票申请已驳回

**注意事项：**
1. 只有已支付（PAID）状态的订单才能申请退票或改签
2. 改签和退票都涉及手续费的计算，具体金额会根据起飞时间自动计算
3. 所有费用都会从用户钱包余额中扣除或退还`;
}

/**
 * 获取业务规则说明文本（英文）
 */
export function getBookingRulesTextEn(): string {
  return `【Refund and Change Booking Rules】

**Refund Rules:**
- Refund within ${BOOKING_RULES.URGENT_WINDOW_HOURS} hours before departure: ${BOOKING_RULES.URGENT_REFUND_FEE_RATE * 100}% refund fee will be charged
- Refund more than ${BOOKING_RULES.URGENT_WINDOW_HOURS} hours before departure: Full refund, no fee

**Change Booking Rules:**
- Change must be made at least ${BOOKING_RULES.CHANGE.MIN_HOURS_BEFORE_DEPARTURE} hours before departure
- Change fee: ${BOOKING_RULES.CHANGE.FEE_RATE * 100}% of the new booking amount
- Original booking refund: Calculated according to refund rules (${BOOKING_RULES.URGENT_REFUND_FEE_RATE * 100}% fee if within ${BOOKING_RULES.URGENT_WINDOW_HOURS} hours)
- Price difference: New booking amount + Change fee - Original booking refund
- Changed bookings cannot be changed again
- Must select different flight or different cabin class

**Urgent Surcharge:**
- Booking within ${BOOKING_RULES.URGENT_WINDOW_HOURS} hours before departure: Additional ${BOOKING_RULES.URGENT_SURCHARGE_RATE * 100}% surcharge on base price

**Booking Status:**
- CREATED: Created but not paid (must complete payment within 15 minutes)
- PAID: Paid and issued
- REFUND_REVIEW: Refund application under review
- REFUNDED: Refunded
- CANCELED: Canceled (payment timeout)
- REFUND_REJECTED: Refund application rejected`;
}

