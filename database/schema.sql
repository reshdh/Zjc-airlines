-- ============================================
-- ZJC 航空公司机票预订系统 - 数据库表结构
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS zjc_airline_booking_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE zjc_airline_booking_db;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    id_number VARCHAR(20) NOT NULL UNIQUE COMMENT '身份证号',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    address VARCHAR(255) COMMENT '地址',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码（加密后）',
    role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '角色：USER-普通用户, ADMIN-管理员',
    enabled TINYINT(1) NOT NULL DEFAULT 1 COMMENT '账号是否启用',
    wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 200.00 COMMENT '钱包余额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_id_number (id_number),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 航班表 (flights)
-- ============================================
CREATE TABLE IF NOT EXISTS flights (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '航班ID',
    flight_number VARCHAR(20) NOT NULL UNIQUE COMMENT '航班号',
    aircraft_type VARCHAR(50) NOT NULL COMMENT '机型',
    origin VARCHAR(50) NOT NULL COMMENT '出发地',
    destination VARCHAR(50) NOT NULL COMMENT '目的地',
    departure_time DATETIME NOT NULL COMMENT '出发时间',
    arrival_time DATETIME NOT NULL COMMENT '到达时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_flight_number (flight_number),
    INDEX idx_origin (origin),
    INDEX idx_destination (destination),
    INDEX idx_departure_time (departure_time),
    INDEX idx_route (origin, destination)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='航班表';

-- ============================================
-- 2.1. 航班舱位表 (flight_seats)
-- ============================================
CREATE TABLE IF NOT EXISTS flight_seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '舱位ID',
    flight_id BIGINT NOT NULL COMMENT '航班ID',
    cabin_class VARCHAR(20) NOT NULL COMMENT '舱位等级：ECONOMY-经济舱, BUSINESS-商务舱, FIRST-头等舱',
    price DECIMAL(10, 2) NOT NULL COMMENT '该舱位票价',
    remaining_seats INT NOT NULL DEFAULT 0 COMMENT '该舱位剩余座位数',
    total_seats INT NOT NULL DEFAULT 0 COMMENT '该舱位总座位数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_flight_cabin (flight_id, cabin_class),
    INDEX idx_flight_id (flight_id),
    INDEX idx_cabin_class (cabin_class)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='航班舱位表';

-- ============================================
-- 3. 预订表 (bookings)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '预订ID',
    flight_id BIGINT NOT NULL COMMENT '航班ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    cabin_class VARCHAR(20) NOT NULL COMMENT '舱位等级：ECONOMY-经济舱, BUSINESS-商务舱, FIRST-头等舱',
    ticket_count INT NOT NULL DEFAULT 1 COMMENT '票数',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '总金额',
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED' COMMENT '状态：CREATED-待支付, PAID-已支付, CANCELED-已取消, REFUND_REVIEW-退票待审, REFUND_REJECTED-退票驳回',
    payment_due_at DATETIME NULL DEFAULT NULL COMMENT '待支付截止时间',
    refund_reason VARCHAR(255) NULL DEFAULT NULL COMMENT '退票原因（用户填写）',
    refund_reject_reason VARCHAR(255) NULL DEFAULT NULL COMMENT '退票驳回原因',
    urgent_surcharge_rate DECIMAL(6,4) NOT NULL DEFAULT 0 COMMENT '临近起飞加价比例',
    refund_fee_rate DECIMAL(6,4) NOT NULL DEFAULT 0 COMMENT '退票手续费比例',
    refund_fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT '退票手续费金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_flight_id (flight_id),
    INDEX idx_status (status),
    INDEX idx_cabin_class (cabin_class),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预订表';

-- ============================================
-- 4. 工单表 (support_tickets)
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '工单ID',
    subject VARCHAR(100) NOT NULL COMMENT '工单主题',
    content TEXT NOT NULL COMMENT '工单内容',
    user_name VARCHAR(50) NOT NULL COMMENT '提交人姓名',
    contact_info VARCHAR(100) NOT NULL COMMENT '联系方式',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' COMMENT '状态：OPEN/IN_PROGRESS/RESOLVED/CLOSED',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '优先级：LOW/NORMAL/HIGH/URGENT',
    admin_reply TEXT COMMENT '管理员回复',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at_support (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户服务工单';

