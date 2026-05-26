-- ============================================
-- ZJC 航空公司 - 座位系统数据库迁移脚本
-- 功能：添加座位选择系统支持
-- 日期：2025-11-19
-- ============================================

USE zjc_airline_booking_db;

-- ============================================
-- 1. 创建机型配置表 (aircraft_types)
-- ============================================
CREATE TABLE IF NOT EXISTS aircraft_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '机型ID',
    code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT '机型代码：SW100, SW300, SW700',
    name VARCHAR(100) NOT NULL COMMENT '机型名称：SkyWing 100, SkyWing 300, SkyWing 700',
    category VARCHAR(20) NOT NULL COMMENT '机型分类：SMALL-小型, MEDIUM-中型, LARGE-大型',
    total_seats INT NOT NULL COMMENT '总座位数',
    first_class_seats INT NOT NULL DEFAULT 0 COMMENT '头等舱座位数',
    business_class_seats INT NOT NULL DEFAULT 0 COMMENT '商务舱座位数',
    economy_class_seats INT NOT NULL DEFAULT 0 COMMENT '经济舱座位数',
    first_class_start_row INT NULL DEFAULT NULL COMMENT '头等舱起始排号',
    first_class_end_row INT NULL DEFAULT NULL COMMENT '头等舱结束排号',
    business_class_start_row INT NULL DEFAULT NULL COMMENT '商务舱起始排号',
    business_class_end_row INT NULL DEFAULT NULL COMMENT '商务舱结束排号',
    economy_class_start_row INT NOT NULL COMMENT '经济舱起始排号',
    economy_class_end_row INT NOT NULL COMMENT '经济舱结束排号',
    layout_config JSON NULL COMMENT '座位布局配置（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_code (code),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机型配置表';

-- ============================================
-- 2. 创建具体座位表 (seats)
-- ============================================
CREATE TABLE IF NOT EXISTS seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '座位ID',
    flight_id BIGINT NOT NULL COMMENT '航班ID',
    cabin_class VARCHAR(20) NOT NULL COMMENT '舱位等级：ECONOMY-经济舱, BUSINESS-商务舱, FIRST-头等舱',
    seat_number VARCHAR(10) NOT NULL COMMENT '座位号，如 "1A", "12C", "3F"',
    seat_row INT NOT NULL COMMENT '排号，如 1, 12, 3',
    seat_column VARCHAR(5) NOT NULL COMMENT '列号，如 "A", "C", "F"',
    seat_type VARCHAR(20) NOT NULL DEFAULT 'NORMAL' COMMENT '座位类型：NORMAL-普通, WINDOW-靠窗, AISLE-过道, EMERGENCY_EXIT-紧急出口, LEGROOM-腿部空间大',
    price_surcharge DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '座位加价（相对舱位基础价）',
    is_available BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否可用（用于维护等，TRUE-可用, FALSE-不可用）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_flight_seat (flight_id, seat_number),
    INDEX idx_flight_id (flight_id),
    INDEX idx_flight_cabin (flight_id, cabin_class),
    INDEX idx_seat_number (seat_number),
    INDEX idx_seat_type (seat_type),
    INDEX idx_is_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='具体座位表';

-- ============================================
-- 3. 创建订单座位关联表 (booking_seats)
-- ============================================
CREATE TABLE IF NOT EXISTS booking_seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
    booking_id BIGINT NOT NULL COMMENT '订单ID',
    seat_id BIGINT NOT NULL COMMENT '座位ID',
    passenger_index INT NOT NULL COMMENT '乘客在订单中的序号（从0开始，对应第几位乘客）',
    passenger_name VARCHAR(100) NULL COMMENT '乘客姓名（冗余字段，便于查询）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uk_booking_seat (booking_id, seat_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_seat_id (seat_id),
    INDEX idx_passenger_index (passenger_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单座位关联表';

-- ============================================
-- 4. 修改 flights 表，添加机型代码关联
-- ============================================

-- 检查是否已存在 aircraft_type_code 字段
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'zjc_airline_booking_db' 
     AND TABLE_NAME = 'flights' 
     AND COLUMN_NAME = 'aircraft_type_code') > 0,
    'SELECT 1',  -- 如果字段已存在，什么都不做
    'ALTER TABLE flights ADD COLUMN aircraft_type_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT ''机型代码（关联aircraft_types表）'' AFTER aircraft_type'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 如果外键约束已存在但有问题，先删除它
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = 'zjc_airline_booking_db' 
     AND TABLE_NAME = 'flights' 
     AND CONSTRAINT_NAME = 'fk_flights_aircraft_type') > 0,
    'ALTER TABLE flights DROP FOREIGN KEY fk_flights_aircraft_type',
    'SELECT 1'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 如果字段已存在但字符集不匹配，先修改字段
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'zjc_airline_booking_db' 
     AND TABLE_NAME = 'flights' 
     AND COLUMN_NAME = 'aircraft_type_code'
     AND CHARACTER_SET_NAME = 'utf8mb4'
     AND COLLATION_NAME = 'utf8mb4_unicode_ci') > 0,
    'SELECT 1',  -- 如果字符集已匹配，什么都不做
    'ALTER TABLE flights MODIFY COLUMN aircraft_type_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT ''机型代码（关联aircraft_types表）'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加外键约束（如果不存在）
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = 'zjc_airline_booking_db' 
     AND TABLE_NAME = 'flights' 
     AND CONSTRAINT_NAME = 'fk_flights_aircraft_type') > 0,
    'SELECT 1',
    'ALTER TABLE flights ADD CONSTRAINT fk_flights_aircraft_type FOREIGN KEY (aircraft_type_code) REFERENCES aircraft_types(code) ON UPDATE CASCADE'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加索引（如果不存在）
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = 'zjc_airline_booking_db' 
     AND TABLE_NAME = 'flights' 
     AND INDEX_NAME = 'idx_aircraft_type_code') > 0,
    'SELECT 1',
    'CREATE INDEX idx_aircraft_type_code ON flights(aircraft_type_code)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 5. 插入三种机型配置数据（包含价格信息）
-- ============================================

-- 首先添加价格字段到 aircraft_types 表（如果不存在）
-- 添加经济舱基础价格字段
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'zjc_airline_booking_db' 
     AND TABLE_NAME = 'aircraft_types' 
     AND COLUMN_NAME = 'economy_class_base_price') > 0,
    'SELECT 1',
    'ALTER TABLE aircraft_types ADD COLUMN economy_class_base_price DECIMAL(10, 2) NOT NULL DEFAULT 800.00 COMMENT ''经济舱基础价格'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加商务舱基础价格字段
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'zjc_airline_booking_db' 
     AND TABLE_NAME = 'aircraft_types' 
     AND COLUMN_NAME = 'business_class_base_price') > 0,
    'SELECT 1',
    'ALTER TABLE aircraft_types ADD COLUMN business_class_base_price DECIMAL(10, 2) NOT NULL DEFAULT 2000.00 COMMENT ''商务舱基础价格'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加头等舱基础价格字段
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'zjc_airline_booking_db' 
     AND TABLE_NAME = 'aircraft_types' 
     AND COLUMN_NAME = 'first_class_base_price') > 0,
    'SELECT 1',
    'ALTER TABLE aircraft_types ADD COLUMN first_class_base_price DECIMAL(10, 2) NOT NULL DEFAULT 5000.00 COMMENT ''头等舱基础价格'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- SkyWing 100 (小型机) - 短途航线适用
INSERT INTO aircraft_types (
    code, name, category, total_seats,
    first_class_seats, business_class_seats, economy_class_seats,
    first_class_start_row, first_class_end_row,
    business_class_start_row, business_class_end_row,
    economy_class_start_row, economy_class_end_row,
    economy_class_base_price, business_class_base_price, first_class_base_price,
    layout_config
) VALUES (
    'SW100', 'SkyWing 100', 'SMALL', 114,
    0, 12, 102,
    NULL, NULL,
    1, 3,
    4, 20,
    600.00,  -- 经济舱基础价格：600元
    1800.00, -- 商务舱基础价格：1800元
    0.00,    -- 无头等舱
    JSON_OBJECT(
        'business', JSON_OBJECT('layout', '2-2', 'columns', JSON_ARRAY('A', 'B', 'C', 'D')),
        'economy', JSON_OBJECT('layout', '2-2', 'columns', JSON_ARRAY('A', 'B', 'C', 'D'))
    )
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category = VALUES(category),
    total_seats = VALUES(total_seats),
    first_class_seats = VALUES(first_class_seats),
    business_class_seats = VALUES(business_class_seats),
    economy_class_seats = VALUES(economy_class_seats),
    economy_class_base_price = VALUES(economy_class_base_price),
    business_class_base_price = VALUES(business_class_base_price),
    first_class_base_price = VALUES(first_class_base_price),
    layout_config = VALUES(layout_config);

-- SkyWing 300 (中型机) - 中短途航线适用
INSERT INTO aircraft_types (
    code, name, category, total_seats,
    first_class_seats, business_class_seats, economy_class_seats,
    first_class_start_row, first_class_end_row,
    business_class_start_row, business_class_end_row,
    economy_class_start_row, economy_class_end_row,
    economy_class_base_price, business_class_base_price, first_class_base_price,
    layout_config
) VALUES (
    'SW300', 'SkyWing 300', 'MEDIUM', 191,
    2, 8, 181,
    1, 1,
    2, 3,
    4, 33,
    800.00,  -- 经济舱基础价格：800元
    2400.00, -- 商务舱基础价格：2400元
    5000.00, -- 头等舱基础价格：5000元
    JSON_OBJECT(
        'first', JSON_OBJECT('layout', '2-0', 'columns', JSON_ARRAY('A', 'B')),
        'business', JSON_OBJECT('layout', '2-2', 'columns', JSON_ARRAY('A', 'B', 'C', 'D')),
        'economy', JSON_OBJECT('layout', '3-3', 'columns', JSON_ARRAY('A', 'B', 'C', 'D', 'E', 'F'))
    )
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category = VALUES(category),
    total_seats = VALUES(total_seats),
    first_class_seats = VALUES(first_class_seats),
    business_class_seats = VALUES(business_class_seats),
    economy_class_seats = VALUES(economy_class_seats),
    economy_class_base_price = VALUES(economy_class_base_price),
    business_class_base_price = VALUES(business_class_base_price),
    first_class_base_price = VALUES(first_class_base_price),
    layout_config = VALUES(layout_config);

-- SkyWing 700 (大型机) - 长途航线适用
INSERT INTO aircraft_types (
    code, name, category, total_seats,
    first_class_seats, business_class_seats, economy_class_seats,
    first_class_start_row, first_class_end_row,
    business_class_start_row, business_class_end_row,
    economy_class_start_row, economy_class_end_row,
    economy_class_base_price, business_class_base_price, first_class_base_price,
    layout_config
) VALUES (
    'SW700', 'SkyWing 700', 'LARGE', 365,
    8, 42, 315,
    1, 2,
    3, 11,
    12, 59,
    1200.00, -- 经济舱基础价格：1200元
    3600.00, -- 商务舱基础价格：3600元
    8000.00, -- 头等舱基础价格：8000元
    JSON_OBJECT(
        'first', JSON_OBJECT('layout', '1-2-1', 'columns', JSON_ARRAY('A', 'B', 'C', 'D')),
        'business', JSON_OBJECT('layout', '2-4-2', 'columns', JSON_ARRAY('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
        'economy', JSON_OBJECT('layout', '3-4-3', 'columns', JSON_ARRAY('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'))
    )
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category = VALUES(category),
    total_seats = VALUES(total_seats),
    first_class_seats = VALUES(first_class_seats),
    business_class_seats = VALUES(business_class_seats),
    economy_class_seats = VALUES(economy_class_seats),
    economy_class_base_price = VALUES(economy_class_base_price),
    business_class_base_price = VALUES(business_class_base_price),
    first_class_base_price = VALUES(first_class_base_price),
    layout_config = VALUES(layout_config);

-- ============================================
-- 6. 初始化现有航班的座位（示例：为所有航班初始化座位）
-- 注意：这个存储过程会根据航班的 aircraft_type_code 自动生成座位
-- ============================================

DELIMITER $$

-- 创建存储过程：为单个航班初始化座位
DROP PROCEDURE IF EXISTS initialize_flight_seats$$
CREATE PROCEDURE initialize_flight_seats(IN p_flight_id BIGINT)
BEGIN
    DECLARE v_aircraft_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_first_start INT;
    DECLARE v_first_end INT;
    DECLARE v_business_start INT;
    DECLARE v_business_end INT;
    DECLARE v_economy_start INT;
    DECLARE v_economy_end INT;
    DECLARE v_row INT;
    DECLARE v_columns JSON;
    DECLARE v_column VARCHAR(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_seat_type VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_column_index INT;
    DECLARE v_layout_config JSON;
    DECLARE v_error_msg VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    -- 获取航班的机型代码
    SELECT aircraft_type_code INTO v_aircraft_code
    FROM flights WHERE id = p_flight_id;
    
    -- 如果机型代码为空，跳过
    IF v_aircraft_code IS NULL THEN
        SET v_error_msg = '航班机型代码为空，无法初始化座位';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_msg;
    END IF;
    
    -- 获取机型配置
    SELECT 
        first_class_start_row, first_class_end_row,
        business_class_start_row, business_class_end_row,
        economy_class_start_row, economy_class_end_row,
        layout_config
    INTO 
        v_first_start, v_first_end,
        v_business_start, v_business_end,
        v_economy_start, v_economy_end,
        v_layout_config
    FROM aircraft_types
    WHERE code COLLATE utf8mb4_unicode_ci = v_aircraft_code;
    
    -- 如果机型不存在（通过检查 layout_config 是否为 NULL 来判断）
    IF v_layout_config IS NULL THEN
        SET v_error_msg = CONCAT('机型配置不存在: ', IFNULL(v_aircraft_code, 'NULL'));
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_msg;
    END IF;
    
    -- 初始化头等舱座位（如果有）
    IF v_first_start IS NOT NULL AND v_first_end IS NOT NULL THEN
        SET v_columns = JSON_EXTRACT(v_layout_config, '$.first.columns');
        SET v_row = v_first_start;
        WHILE v_row <= v_first_end DO
            SET v_column_index = 0;
            WHILE v_column_index < JSON_LENGTH(v_columns) DO
                SET v_column = JSON_UNQUOTE(JSON_EXTRACT(v_columns, CONCAT('$[', v_column_index, ']')));
                -- 判断座位类型：A/D为靠窗，B/C为过道（对于1-2-1布局）
                IF v_column COLLATE utf8mb4_unicode_ci IN ('A', 'D') THEN
                    SET v_seat_type = 'WINDOW';
                ELSE
                    SET v_seat_type = 'AISLE';
                END IF;
                
                INSERT INTO seats (flight_id, cabin_class, seat_number, seat_row, seat_column, seat_type, is_available)
                VALUES (p_flight_id, 'FIRST', CONCAT(v_row, v_column), v_row, v_column, v_seat_type, TRUE)
                ON DUPLICATE KEY UPDATE
                    seat_type = v_seat_type,
                    is_available = TRUE;
                
                SET v_column_index = v_column_index + 1;
            END WHILE;
            SET v_row = v_row + 1;
        END WHILE;
    END IF;
    
    -- 初始化商务舱座位
    IF v_business_start IS NOT NULL AND v_business_end IS NOT NULL THEN
        SET v_columns = JSON_EXTRACT(v_layout_config, '$.business.columns');
        SET v_row = v_business_start;
        WHILE v_row <= v_business_end DO
            SET v_column_index = 0;
            WHILE v_column_index < JSON_LENGTH(v_columns) DO
                SET v_column = JSON_UNQUOTE(JSON_EXTRACT(v_columns, CONCAT('$[', v_column_index, ']')));
                -- 判断座位类型
                IF v_aircraft_code COLLATE utf8mb4_unicode_ci = 'SW100' COLLATE utf8mb4_unicode_ci 
                   OR v_aircraft_code COLLATE utf8mb4_unicode_ci = 'SW300' COLLATE utf8mb4_unicode_ci THEN
                    -- 2-2布局：A/D为靠窗，B/C为过道
                    IF v_column COLLATE utf8mb4_unicode_ci IN ('A', 'D') THEN
                        SET v_seat_type = 'WINDOW';
                    ELSE
                        SET v_seat_type = 'AISLE';
                    END IF;
                ELSEIF v_aircraft_code COLLATE utf8mb4_unicode_ci = 'SW700' COLLATE utf8mb4_unicode_ci THEN
                    -- 2-4-2布局：A/H为靠窗，C/G为过道
                    IF v_column COLLATE utf8mb4_unicode_ci IN ('A', 'H') THEN
                        SET v_seat_type = 'WINDOW';
                    ELSEIF v_column COLLATE utf8mb4_unicode_ci IN ('C', 'G') THEN
                        SET v_seat_type = 'AISLE';
                    ELSE
                        SET v_seat_type = 'NORMAL';
                    END IF;
                ELSE
                    SET v_seat_type = 'NORMAL';
                END IF;
                
                INSERT INTO seats (flight_id, cabin_class, seat_number, seat_row, seat_column, seat_type, is_available)
                VALUES (p_flight_id, 'BUSINESS', CONCAT(v_row, v_column), v_row, v_column, v_seat_type, TRUE)
                ON DUPLICATE KEY UPDATE
                    seat_type = v_seat_type,
                    is_available = TRUE;
                
                SET v_column_index = v_column_index + 1;
            END WHILE;
            SET v_row = v_row + 1;
        END WHILE;
    END IF;
    
    -- 初始化经济舱座位
    SET v_columns = JSON_EXTRACT(v_layout_config, '$.economy.columns');
    SET v_row = v_economy_start;
    WHILE v_row <= v_economy_end DO
        SET v_column_index = 0;
        WHILE v_column_index < JSON_LENGTH(v_columns) DO
            SET v_column = JSON_UNQUOTE(JSON_EXTRACT(v_columns, CONCAT('$[', v_column_index, ']')));
            
            -- 判断座位类型和特殊排号
            SET v_seat_type = 'NORMAL';
            IF v_aircraft_code COLLATE utf8mb4_unicode_ci = 'SW100' COLLATE utf8mb4_unicode_ci 
               OR v_aircraft_code COLLATE utf8mb4_unicode_ci = 'SW300' COLLATE utf8mb4_unicode_ci THEN
                -- 2-2或3-3布局
                IF v_row = 4 THEN
                    -- 经济舱第一排（紧急出口），腿部空间大
                    SET v_seat_type = 'LEGROOM';
                ELSEIF v_column COLLATE utf8mb4_unicode_ci IN ('A', 'F') THEN
                    SET v_seat_type = 'WINDOW';
                ELSEIF v_column COLLATE utf8mb4_unicode_ci IN ('C', 'D') THEN
                    SET v_seat_type = 'AISLE';
                END IF;
            ELSEIF v_aircraft_code COLLATE utf8mb4_unicode_ci = 'SW700' COLLATE utf8mb4_unicode_ci THEN
                -- 3-4-3布局
                IF v_row BETWEEN 12 AND 13 THEN
                    -- 紧急出口排
                    SET v_seat_type = 'EMERGENCY_EXIT';
                ELSEIF v_column COLLATE utf8mb4_unicode_ci IN ('A', 'K') THEN
                    SET v_seat_type = 'WINDOW';
                ELSEIF v_column COLLATE utf8mb4_unicode_ci IN ('C', 'G') THEN
                    SET v_seat_type = 'AISLE';
                END IF;
            END IF;
            
            -- 最后一排可能座位数不完整，需要根据实际情况判断
            -- 这里简化处理，所有座位都插入
            INSERT INTO seats (flight_id, cabin_class, seat_number, seat_row, seat_column, seat_type, is_available)
            VALUES (p_flight_id, 'ECONOMY', CONCAT(v_row, v_column), v_row, v_column, v_seat_type, TRUE)
            ON DUPLICATE KEY UPDATE
                seat_type = v_seat_type,
                is_available = TRUE;
            
            SET v_column_index = v_column_index + 1;
        END WHILE;
        SET v_row = v_row + 1;
    END WHILE;
    
     -- 注意：不再更新 flight_seats 表
     -- 总座位数和剩余座位数可以从 seats 表和 booking_seats 表动态计算
     -- 价格信息需要存储在其他位置（如 aircraft_types 表或单独的价格配置表）
     
 END$$

DELIMITER ;

-- ============================================
-- 7. 删除旧的 flight_seats 表
-- 注意：删除前请确保已经迁移了所有需要的数据
-- ============================================

-- 删除 flight_seats 表（如果存在）
DROP TABLE IF EXISTS flight_seats;

-- ============================================
-- 8. 为现有航班设置机型代码并初始化座位
-- 根据航线距离和需求合理分配机型
-- ============================================

-- SW100（小型机）- 适用于短途航线（1-2小时飞行时间）
-- 航班：ZJC003(广州-深圳), ZJC006(广州-杭州), ZJC009(广州-杭州), ZJC013(广州-深圳)
UPDATE flights SET aircraft_type_code = 'SW100' WHERE id IN (3, 6, 9, 13);

-- SW300（中型机）- 适用于中短途航线（2-3小时飞行时间）
-- 航班：ZJC001(北京-上海), ZJC002(上海-广州), ZJC007(深圳-北京), ZJC011(上海-北京), ZJC012(上海-广州)
UPDATE flights SET aircraft_type_code = 'SW300' WHERE id IN (1, 2, 7, 11, 12);

-- SW700（大型机）- 适用于长途航线（3小时以上飞行时间）
-- 航班：ZJC004(北京-深圳), ZJC005(上海-成都), ZJC008(成都-上海), ZJC010(北京-成都), ZJC014(北京-成都), ZJC015(杭州-深圳)
UPDATE flights SET aircraft_type_code = 'SW700' WHERE id IN (4, 5, 8, 10, 14, 15);

-- 为所有航班初始化座位
CALL initialize_flight_seats(1);
CALL initialize_flight_seats(2);
CALL initialize_flight_seats(3);
CALL initialize_flight_seats(4);
CALL initialize_flight_seats(5);
CALL initialize_flight_seats(6);
CALL initialize_flight_seats(7);
CALL initialize_flight_seats(8);
CALL initialize_flight_seats(9);
CALL initialize_flight_seats(10);
CALL initialize_flight_seats(11);
CALL initialize_flight_seats(12);
CALL initialize_flight_seats(13);
CALL initialize_flight_seats(14);
CALL initialize_flight_seats(15);

-- ============================================
-- 完成
-- ============================================
SELECT '座位系统数据库迁移完成！' AS message;




