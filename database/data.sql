-- ============================================
-- ZJC 航空公司机票预订系统 - 示例数据
-- ============================================

USE zjc_airline_booking_db;

-- ============================================
-- 1. 用户数据 (users)
-- ============================================
-- 注意：密码使用 BCrypt 加密，默认密码为 "123456"
-- BCrypt 哈希值示例（实际使用时应该使用 Spring Security 的 BCryptPasswordEncoder）
INSERT INTO users (name, id_number, phone, address, username, password, role, status, wallet_balance, created_at, updated_at) VALUES
('张三', '110101199001011234', '13800138001', '北京市朝阳区建国路88号', 'zhangsan', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pQ1O', 'USER', 1, 200.00, '2025-11-11 09:00:00', '2025-11-11 09:00:00'),
('李四', '110101199002021234', '13800138002', '上海市浦东新区陆家嘴环路1000号', 'lisi', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pQ1O', 'USER', 1, 200.00, '2025-11-10 15:30:00', '2025-11-10 15:30:00'),
('王五', '110101199003031234', '13800138003', '广州市天河区天河路123号', 'wangwu', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pQ1O', 'USER', 0, 200.00, '2025-11-09 18:45:00', '2025-11-09 18:45:00'),
('赵六', '110101199004041234', '13800138004', '深圳市南山区科技园南路1000号', 'zhaoliu', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pQ1O', 'USER', 0, 200.00, '2025-11-08 13:10:00', '2025-11-08 13:10:00'),
('管理员', '110101199000001234', '13800138000', '北京市海淀区中关村大街1号', 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pQ1O', 'ADMIN', 1, 0.00, '2025-11-07 20:20:00', '2025-11-07 20:20:00'),
('刘七', '110101199005051234', '13800138005', '杭州市西湖区文三路259号', 'liuqi', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pQ1O', 'USER', 1, 200.00, '2025-11-06 11:05:00', '2025-11-06 11:05:00'),
('陈八', '110101199006061234', '13800138006', '成都市锦江区春熙路123号', 'chenba', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pQ1O', 'USER', 0, 200.00, '2025-11-05 16:40:00', '2025-11-05 16:40:00'),
('周九', '110101199007071234', '13800138007', '武汉市洪山区珞喻路461号', 'zhoujiu', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pQ1O', 'USER', 1, 200.00, '2025-11-04 14:25:00', '2025-11-04 14:25:00');

-- ============================================
-- 2. 航班数据 (flights)
-- ============================================
INSERT INTO flights (flight_number, aircraft_type, origin, destination, departure_time, arrival_time) VALUES
('ZJC001', '波音737-800', '北京', '上海', '2025-12-01 08:00:00', '2025-12-01 10:30:00'),
('ZJC002', '空客A320', '上海', '广州', '2025-12-01 14:00:00', '2025-12-01 16:45:00'),
('ZJC003', '波音737-800', '广州', '深圳', '2025-12-01 10:30:00', '2025-12-01 11:30:00'),
('ZJC004', '空客A330', '北京', '深圳', '2025-12-02 09:00:00', '2025-12-02 12:30:00'),
('ZJC005', '波音787', '上海', '成都', '2025-12-02 11:00:00', '2025-12-02 14:15:00'),
('ZJC006', '空客A320', '广州', '杭州', '2025-12-02 13:30:00', '2025-12-02 15:20:00'),
('ZJC007', '波音737-800', '深圳', '北京', '2025-12-03 08:30:00', '2025-12-03 11:00:00'),
('ZJC008', '空客A320', '成都', '上海', '2025-12-03 15:00:00', '2025-12-03 18:15:00'),
('ZJC009', '波音737-800', '杭州', '广州', '2025-12-03 16:00:00', '2025-12-03 17:50:00'),
('ZJC010', '空客A330', '北京', '成都', '2025-12-04 10:00:00', '2025-12-04 13:30:00'),
('ZJC011', '波音787', '上海', '北京', '2025-12-04 14:00:00', '2025-12-04 16:30:00'),
('ZJC012', '空客A320', '广州', '上海', '2025-12-04 17:00:00', '2025-12-04 19:45:00'),
('ZJC013', '波音737-800', '深圳', '广州', '2025-12-05 09:30:00', '2025-12-05 10:30:00'),
('ZJC014', '空客A330', '成都', '北京', '2025-12-05 11:00:00', '2025-12-05 14:30:00'),
('ZJC015', '波音787', '杭州', '深圳', '2025-12-05 13:00:00', '2025-12-05 15:30:00');

-- ============================================
-- 2.1. 航班舱位数据 (flight_seats)
-- ============================================
-- ZJC001: 经济舱2个，头等舱1个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(1, 'ECONOMY', 680.00, 2, 150),
(1, 'FIRST', 2800.00, 1, 8);

-- ZJC002: 经济舱8个，商务舱3个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(2, 'ECONOMY', 850.00, 8, 140),
(2, 'BUSINESS', 2500.00, 3, 20);

-- ZJC003: 经济舱22个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(3, 'ECONOMY', 320.00, 22, 180);

-- ZJC004: 经济舱5个，商务舱2个，头等舱1个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(4, 'ECONOMY', 1200.00, 5, 200),
(4, 'BUSINESS', 3500.00, 2, 30),
(4, 'FIRST', 8000.00, 1, 10);

-- ZJC005: 经济舱12个，商务舱4个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(5, 'ECONOMY', 980.00, 12, 160),
(5, 'BUSINESS', 2800.00, 4, 25);

-- ZJC006: 经济舱18个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(6, 'ECONOMY', 550.00, 18, 150);

-- ZJC007: 经济舱20个，商务舱5个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(7, 'ECONOMY', 680.00, 20, 150),
(7, 'BUSINESS', 2200.00, 5, 20);

-- ZJC008: 经济舱10个，头等舱2个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(8, 'ECONOMY', 980.00, 10, 160),
(8, 'FIRST', 4500.00, 2, 8);

-- ZJC009: 经济舱25个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(9, 'ECONOMY', 550.00, 25, 180);

-- ZJC010: 经济舱7个，商务舱3个，头等舱1个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(10, 'ECONOMY', 1100.00, 7, 200),
(10, 'BUSINESS', 3200.00, 3, 30),
(10, 'FIRST', 7500.00, 1, 10);

-- ZJC011: 经济舱15个，商务舱6个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(11, 'ECONOMY', 680.00, 15, 150),
(11, 'BUSINESS', 2400.00, 6, 25);

-- ZJC012: 经济舱9个，商务舱2个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(12, 'ECONOMY', 850.00, 9, 140),
(12, 'BUSINESS', 2500.00, 2, 20);

-- ZJC013: 经济舱30个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(13, 'ECONOMY', 320.00, 30, 180);

-- ZJC014: 经济舱6个，商务舱4个，头等舱2个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(14, 'ECONOMY', 1100.00, 6, 200),
(14, 'BUSINESS', 3300.00, 4, 30),
(14, 'FIRST', 8200.00, 2, 10);

-- ZJC015: 经济舱14个，商务舱3个
INSERT INTO flight_seats (flight_id, cabin_class, price, remaining_seats, total_seats) VALUES
(15, 'ECONOMY', 750.00, 14, 160),
(15, 'BUSINESS', 2600.00, 3, 25);

-- ============================================
-- 3. 预订数据 (bookings)
-- ============================================
INSERT INTO bookings (
  flight_id,
  user_id,
  cabin_class,
  ticket_count,
  total_amount,
  status,
  payment_due_at,
  refund_reason,
  refund_reject_reason,
  urgent_surcharge_rate,
  refund_fee_rate,
  refund_fee_amount
) VALUES
(1, 1, 'ECONOMY', 2, 1360.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(2, 1, 'ECONOMY', 1, 850.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(3, 2, 'ECONOMY', 1, 320.00, 'CREATED', NULL, NULL, NULL, 0, 0, 0),
(4, 3, 'ECONOMY', 2, 2400.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(5, 4, 'ECONOMY', 1, 980.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(6, 5, 'ECONOMY', 3, 1650.00, 'CANCELED', NULL, NULL, NULL, 0, 0, 0),
(7, 6, 'ECONOMY', 1, 680.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(8, 7, 'ECONOMY', 2, 1960.00, 'CREATED', NULL, NULL, NULL, 0, 0, 0),
(9, 8, 'ECONOMY', 1, 550.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(10, 1, 'ECONOMY', 1, 1100.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(11, 2, 'ECONOMY', 2, 1360.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(12, 3, 'ECONOMY', 1, 850.00, 'CREATED', NULL, NULL, NULL, 0, 0, 0),
(13, 4, 'ECONOMY', 1, 320.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(14, 5, 'ECONOMY', 2, 2200.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(15, 6, 'ECONOMY', 1, 750.00, 'CREATED', NULL, NULL, NULL, 0, 0, 0),
(1, 2, 'FIRST', 1, 2800.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(4, 1, 'BUSINESS', 1, 3500.00, 'PAID', NULL, NULL, NULL, 0, 0, 0),
(10, 2, 'FIRST', 1, 7500.00, 'PAID', NULL, NULL, NULL, 0, 0, 0);

-- ============================================
-- 4. 工单数据 (support_tickets)
-- ============================================
INSERT INTO support_tickets (subject, content, user_name, contact_info, status, priority, admin_reply) VALUES
('无法完成支付', '我在支付订单 ZJC001 时提示失败，请协助解决。', '张三', 'zhangsan@example.com', 'OPEN', 'HIGH', NULL),
('需要发票', '订单 ZJC005 需要开具增值税发票，请问怎么操作？', '李四', '13800138002', 'IN_PROGRESS', 'NORMAL', '已转财务处理'),
('航班延误补偿咨询', '航班 ZJC004 延误了两个小时，是否有补偿政策？', '王五', 'wangwu@example.com', 'RESOLVED', 'LOW', '您好，已为您申请代金券补偿，请注意查收短信。');

