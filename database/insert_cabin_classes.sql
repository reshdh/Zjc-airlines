-- ============================================
-- 插入商务舱和头等舱数据
-- 适用于已有经济舱数据的情况
-- 执行日期：2025-11-18
-- ============================================

USE zjc_airline_booking_db;

-- ============================================
-- 说明：
-- 1. 商务舱（BUSINESS）价格约为经济舱的 2.5-3.5 倍
-- 2. 头等舱（FIRST）价格约为经济舱的 4-8 倍
-- 3. 此脚本会检查是否已存在数据，避免重复插入
-- ============================================

-- ZJC001: 北京 -> 上海 (经济舱 680.00)
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 1, 'BUSINESS', 2200.00, 5, 25, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 1 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 1, 'FIRST', 4500.00, 2, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 1 AND `cabin_class` = 'FIRST');

-- ZJC002: 上海 -> 广州 (经济舱 850.00)
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 2, 'BUSINESS', 2800.00, 4, 25, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 2 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 2, 'FIRST', 5500.00, 1, 8, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 2 AND `cabin_class` = 'FIRST');

-- ZJC003: 广州 -> 深圳 (经济舱 320.00) - 短途，只添加商务舱
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 3, 'BUSINESS', 1200.00, 3, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 3 AND `cabin_class` = 'BUSINESS');

-- ZJC004: 北京 -> 深圳 (经济舱 1200.00) - 长途，添加商务舱和头等舱
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 4, 'BUSINESS', 3800.00, 3, 30, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 4 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 4, 'FIRST', 8500.00, 1, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 4 AND `cabin_class` = 'FIRST');

-- ZJC005: 上海 -> 成都 (经济舱 980.00)
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 5, 'BUSINESS', 3000.00, 5, 25, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 5 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 5, 'FIRST', 6000.00, 2, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 5 AND `cabin_class` = 'FIRST');

-- ZJC006: 广州 -> 杭州 (经济舱 550.00) - 短途，只添加商务舱
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 6, 'BUSINESS', 1800.00, 4, 22, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 6 AND `cabin_class` = 'BUSINESS');

-- ZJC007: 深圳 -> 北京 (经济舱 680.00)
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 7, 'BUSINESS', 2200.00, 6, 25, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 7 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 7, 'FIRST', 4500.00, 1, 8, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 7 AND `cabin_class` = 'FIRST');

-- ZJC008: 成都 -> 上海 (经济舱 980.00)
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 8, 'BUSINESS', 3000.00, 3, 25, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 8 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 8, 'FIRST', 6000.00, 1, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 8 AND `cabin_class` = 'FIRST');

-- ZJC009: 杭州 -> 广州 (经济舱 550.00) - 短途，只添加商务舱
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 9, 'BUSINESS', 1800.00, 5, 22, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 9 AND `cabin_class` = 'BUSINESS');

-- ZJC010: 北京 -> 成都 (经济舱 1100.00) - 长途，添加商务舱和头等舱
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 10, 'BUSINESS', 3500.00, 4, 30, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 10 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 10, 'FIRST', 8000.00, 2, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 10 AND `cabin_class` = 'FIRST');

-- ZJC011: 上海 -> 北京 (经济舱 680.00)
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 11, 'BUSINESS', 2200.00, 5, 25, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 11 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 11, 'FIRST', 4500.00, 1, 8, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 11 AND `cabin_class` = 'FIRST');

-- ZJC012: 广州 -> 上海 (经济舱 850.00)
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 12, 'BUSINESS', 2800.00, 3, 25, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 12 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 12, 'FIRST', 5500.00, 1, 8, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 12 AND `cabin_class` = 'FIRST');

-- ZJC013: 深圳 -> 广州 (经济舱 320.00) - 短途，只添加商务舱
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 13, 'BUSINESS', 1200.00, 4, 20, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 13 AND `cabin_class` = 'BUSINESS');

-- ZJC014: 成都 -> 北京 (经济舱 1100.00) - 长途，添加商务舱和头等舱
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 14, 'BUSINESS', 3500.00, 5, 30, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 14 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 14, 'FIRST', 8000.00, 2, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 14 AND `cabin_class` = 'FIRST');

-- ZJC015: 杭州 -> 深圳 (经济舱 750.00)
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 15, 'BUSINESS', 2400.00, 4, 25, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 15 AND `cabin_class` = 'BUSINESS');

INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 15, 'FIRST', 5000.00, 1, 8, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `flight_seats` WHERE `flight_id` = 15 AND `cabin_class` = 'FIRST');

-- ============================================
-- 验证插入结果
-- ============================================
SELECT 
    f.flight_number,
    f.origin,
    f.destination,
    fs.cabin_class,
    fs.price,
    fs.remaining_seats,
    fs.total_seats
FROM `flight_seats` fs
JOIN `flights` f ON fs.flight_id = f.id
ORDER BY f.id, 
    CASE fs.cabin_class 
        WHEN 'ECONOMY' THEN 1 
        WHEN 'BUSINESS' THEN 2 
        WHEN 'FIRST' THEN 3 
    END;

-- 统计各舱位数量
SELECT 
    cabin_class,
    COUNT(*) AS flight_count,
    SUM(remaining_seats) AS total_remaining_seats,
    SUM(total_seats) AS total_seats
FROM `flight_seats`
GROUP BY cabin_class;

-- ============================================
-- 插入完成
-- ============================================

