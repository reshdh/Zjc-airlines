-- ============================================
-- ZJC 航空公司 - 插入示例航班数据
-- 功能：根据新的座位系统设计，插入示例航班并初始化座位
-- 日期：2025-11-19
-- ============================================
-- 
-- 重要提示：
-- 1. 请先执行 database/migration_add_seat_system.sql 脚本
--    该脚本会创建必要的表结构、机型配置和存储过程
-- 2. 如果存储过程已存在，请先删除并重新创建以确保使用最新版本
-- 3. 本脚本会在存储过程不存在时报错，请确保已执行迁移脚本
-- ============================================

USE zjc_airline_booking_db;

-- ============================================
-- 0. 重新创建存储过程（确保使用修复后的版本）
-- ============================================
-- 注意：如果存储过程已存在旧版本，需要重新创建以修复排序规则问题

DELIMITER $$

-- 删除旧版本的存储过程（如果存在）
DROP PROCEDURE IF EXISTS initialize_flight_seats$$

-- 创建修复后的存储过程：为单个航班初始化座位
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
-- 1. 创建航班价格配置表（用于存储不同航线的舱位价格）
-- ============================================
CREATE TABLE IF NOT EXISTS flight_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '价格配置ID',
    flight_id BIGINT NOT NULL COMMENT '航班ID',
    cabin_class VARCHAR(20) NOT NULL COMMENT '舱位等级：ECONOMY-经济舱, BUSINESS-商务舱, FIRST-头等舱',
    base_price DECIMAL(10, 2) NOT NULL COMMENT '基础价格',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_flight_cabin (flight_id, cabin_class),
    INDEX idx_flight_id (flight_id),
    INDEX idx_cabin_class (cabin_class)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='航班价格配置表';

-- ============================================
-- 2. 清空现有航班数据（可选，如果需要重新开始）
-- ============================================
-- 注意：如果已有订单关联，请先处理订单数据
-- DELETE FROM bookings WHERE flight_id IN (SELECT id FROM flights);
-- DELETE FROM flights;

-- ============================================
-- 3. 插入示例航班数据
-- ============================================

-- 小型机 (SW100) - 短途航线
INSERT INTO flights (flight_number, aircraft_type, aircraft_type_code, origin, destination, departure_time, arrival_time, created_at, updated_at) VALUES
('ZJC101', 'SkyWing 100', 'SW100', '北京', '上海', '2025-12-01 08:00:00', '2025-12-01 10:30:00', NOW(), NOW()),
('ZJC102', 'SkyWing 100', 'SW100', '上海', '北京', '2025-12-01 14:00:00', '2025-12-01 16:30:00', NOW(), NOW()),
('ZJC103', 'SkyWing 100', 'SW100', '广州', '深圳', '2025-12-01 10:30:00', '2025-12-01 11:30:00', NOW(), NOW()),
('ZJC104', 'SkyWing 100', 'SW100', '深圳', '广州', '2025-12-01 16:00:00', '2025-12-01 17:00:00', NOW(), NOW()),
('ZJC105', 'SkyWing 100', 'SW100', '杭州', '上海', '2025-12-01 09:00:00', '2025-12-01 10:00:00', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    aircraft_type = VALUES(aircraft_type),
    aircraft_type_code = VALUES(aircraft_type_code),
    origin = VALUES(origin),
    destination = VALUES(destination),
    departure_time = VALUES(departure_time),
    arrival_time = VALUES(arrival_time),
    updated_at = NOW();

-- 中型机 (SW300) - 中短途航线
INSERT INTO flights (flight_number, aircraft_type, aircraft_type_code, origin, destination, departure_time, arrival_time, created_at, updated_at) VALUES
('ZJC201', 'SkyWing 300', 'SW300', '北京', '广州', '2025-12-01 08:00:00', '2025-12-01 11:30:00', NOW(), NOW()),
('ZJC202', 'SkyWing 300', 'SW300', '广州', '北京', '2025-12-01 14:00:00', '2025-12-01 17:30:00', NOW(), NOW()),
('ZJC203', 'SkyWing 300', 'SW300', '上海', '成都', '2025-12-01 10:00:00', '2025-12-01 13:00:00', NOW(), NOW()),
('ZJC204', 'SkyWing 300', 'SW300', '成都', '上海', '2025-12-01 15:00:00', '2025-12-01 18:00:00', NOW(), NOW()),
('ZJC205', 'SkyWing 300', 'SW300', '北京', '深圳', '2025-12-02 08:00:00', '2025-12-02 11:30:00', NOW(), NOW()),
('ZJC206', 'SkyWing 300', 'SW300', '深圳', '北京', '2025-12-02 14:00:00', '2025-12-02 17:30:00', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    aircraft_type = VALUES(aircraft_type),
    aircraft_type_code = VALUES(aircraft_type_code),
    origin = VALUES(origin),
    destination = VALUES(destination),
    departure_time = VALUES(departure_time),
    arrival_time = VALUES(arrival_time),
    updated_at = NOW();

-- 大型机 (SW700) - 长途航线
INSERT INTO flights (flight_number, aircraft_type, aircraft_type_code, origin, destination, departure_time, arrival_time, created_at, updated_at) VALUES
('ZJC301', 'SkyWing 700', 'SW700', '北京', '深圳', '2025-12-01 08:00:00', '2025-12-01 11:30:00', NOW(), NOW()),
('ZJC302', 'SkyWing 700', 'SW700', '深圳', '北京', '2025-12-01 14:00:00', '2025-12-01 17:30:00', NOW(), NOW()),
('ZJC303', 'SkyWing 700', 'SW700', '上海', '广州', '2025-12-01 10:00:00', '2025-12-01 12:30:00', NOW(), NOW()),
('ZJC304', 'SkyWing 700', 'SW700', '广州', '上海', '2025-12-01 16:00:00', '2025-12-01 18:30:00', NOW(), NOW()),
('ZJC305', 'SkyWing 700', 'SW700', '北京', '成都', '2025-12-02 08:00:00', '2025-12-02 11:00:00', NOW(), NOW()),
('ZJC306', 'SkyWing 700', 'SW700', '成都', '北京', '2025-12-02 14:00:00', '2025-12-02 17:00:00', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    aircraft_type = VALUES(aircraft_type),
    aircraft_type_code = VALUES(aircraft_type_code),
    origin = VALUES(origin),
    destination = VALUES(destination),
    departure_time = VALUES(departure_time),
    arrival_time = VALUES(arrival_time),
    updated_at = NOW();

-- ============================================
-- 4. 为所有航班初始化座位
-- ============================================

-- 使用存储过程为所有航班初始化座位
-- 注意：如果航班不存在，存储过程会报错，请确保先执行航班插入语句

-- 小型机航班
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC101' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC102' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC103' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC104' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC105' LIMIT 1));

-- 中型机航班
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC201' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC202' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC203' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC204' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC205' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC206' LIMIT 1));

-- 大型机航班
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC301' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC302' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC303' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC304' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC305' LIMIT 1));
CALL initialize_flight_seats((SELECT id FROM flights WHERE flight_number = 'ZJC306' LIMIT 1));

-- ============================================
-- 5. 设置航班价格（根据航线和机型设置不同价格）
-- ============================================

-- 小型机 (SW100) 价格配置
-- 经济舱：500-800元，商务舱：1500-2000元
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 680.00 FROM flights WHERE flight_number = 'ZJC101'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 1800.00 FROM flights WHERE flight_number = 'ZJC101'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 750.00 FROM flights WHERE flight_number = 'ZJC102'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 1900.00 FROM flights WHERE flight_number = 'ZJC102'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 320.00 FROM flights WHERE flight_number = 'ZJC103'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 1200.00 FROM flights WHERE flight_number = 'ZJC103'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 350.00 FROM flights WHERE flight_number = 'ZJC104'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 1300.00 FROM flights WHERE flight_number = 'ZJC104'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 450.00 FROM flights WHERE flight_number = 'ZJC105'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 1500.00 FROM flights WHERE flight_number = 'ZJC105'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

-- 中型机 (SW300) 价格配置
-- 经济舱：600-1000元，商务舱：2000-3000元，头等舱：5000-6000元
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 850.00 FROM flights WHERE flight_number = 'ZJC201'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 2800.00 FROM flights WHERE flight_number = 'ZJC201'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 5500.00 FROM flights WHERE flight_number = 'ZJC201'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 900.00 FROM flights WHERE flight_number = 'ZJC202'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 3000.00 FROM flights WHERE flight_number = 'ZJC202'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 6000.00 FROM flights WHERE flight_number = 'ZJC202'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 750.00 FROM flights WHERE flight_number = 'ZJC203'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 2500.00 FROM flights WHERE flight_number = 'ZJC203'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 5200.00 FROM flights WHERE flight_number = 'ZJC203'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 800.00 FROM flights WHERE flight_number = 'ZJC204'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 2600.00 FROM flights WHERE flight_number = 'ZJC204'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 5300.00 FROM flights WHERE flight_number = 'ZJC204'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 880.00 FROM flights WHERE flight_number = 'ZJC205'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 2900.00 FROM flights WHERE flight_number = 'ZJC205'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 5800.00 FROM flights WHERE flight_number = 'ZJC205'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 920.00 FROM flights WHERE flight_number = 'ZJC206'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 3100.00 FROM flights WHERE flight_number = 'ZJC206'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 6200.00 FROM flights WHERE flight_number = 'ZJC206'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

-- 大型机 (SW700) 价格配置
-- 经济舱：800-1200元，商务舱：3000-4000元，头等舱：7000-9000元
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 1100.00 FROM flights WHERE flight_number = 'ZJC301'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 3500.00 FROM flights WHERE flight_number = 'ZJC301'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 8000.00 FROM flights WHERE flight_number = 'ZJC301'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 1150.00 FROM flights WHERE flight_number = 'ZJC302'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 3800.00 FROM flights WHERE flight_number = 'ZJC302'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 8500.00 FROM flights WHERE flight_number = 'ZJC302'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 980.00 FROM flights WHERE flight_number = 'ZJC303'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 3200.00 FROM flights WHERE flight_number = 'ZJC303'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 7500.00 FROM flights WHERE flight_number = 'ZJC303'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 1050.00 FROM flights WHERE flight_number = 'ZJC304'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 3300.00 FROM flights WHERE flight_number = 'ZJC304'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 7800.00 FROM flights WHERE flight_number = 'ZJC304'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 1200.00 FROM flights WHERE flight_number = 'ZJC305'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 4000.00 FROM flights WHERE flight_number = 'ZJC305'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 9000.00 FROM flights WHERE flight_number = 'ZJC305'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'ECONOMY', 1250.00 FROM flights WHERE flight_number = 'ZJC306'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'BUSINESS', 4200.00 FROM flights WHERE flight_number = 'ZJC306'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);
INSERT INTO flight_prices (flight_id, cabin_class, base_price) 
SELECT id, 'FIRST', 9500.00 FROM flights WHERE flight_number = 'ZJC306'
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price);

-- ============================================
-- 完成
-- ============================================
SELECT '示例航班数据插入完成！' AS message;
SELECT 
    f.flight_number,
    f.aircraft_type,
    f.origin,
    f.destination,
    f.departure_time,
    (SELECT COUNT(*) FROM seats s WHERE s.flight_id = f.id) AS total_seats_created
FROM flights f
ORDER BY f.flight_number;

