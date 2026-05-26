-- ============================================
-- 数据库迁移脚本：添加机舱等级功能
-- 执行日期：2025-11-18
-- ============================================

USE zjc_airline_booking_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 步骤 1: 为 flights 表添加 created_at 和 updated_at 字段
-- ============================================
ALTER TABLE `flights` 
ADD COLUMN `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间' AFTER `origin`,
ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`;

-- 更新现有数据的 created_at 和 updated_at
UPDATE `flights` SET `created_at` = NOW(), `updated_at` = NOW() WHERE `created_at` IS NULL;

-- ============================================
-- 步骤 2: 创建 flight_seats 表（航班舱位表）
-- ============================================
CREATE TABLE IF NOT EXISTS `flight_seats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '舱位ID',
    `flight_id` BIGINT NOT NULL COMMENT '航班ID',
    `cabin_class` VARCHAR(20) NOT NULL COMMENT '舱位等级：ECONOMY-经济舱, BUSINESS-商务舱, FIRST-头等舱',
    `price` DECIMAL(10, 2) NOT NULL COMMENT '该舱位票价',
    `remaining_seats` INT NOT NULL DEFAULT 0 COMMENT '该舱位剩余座位数',
    `total_seats` INT NOT NULL DEFAULT 0 COMMENT '该舱位总座位数',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `uk_flight_cabin` (`flight_id`, `cabin_class`) USING BTREE,
    INDEX `idx_flight_id` (`flight_id`) USING BTREE,
    INDEX `idx_cabin_class` (`cabin_class`) USING BTREE,
    CONSTRAINT `fk_flight_seats_flight` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '航班舱位表';

-- ============================================
-- 步骤 3: 将现有 flights 数据迁移到 flight_seats 表
-- 将现有的 price 和 remaining_seats 作为 ECONOMY 舱位
-- ============================================
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 
    `id` AS `flight_id`,
    'ECONOMY' AS `cabin_class`,
    `price`,
    `remaining_seats` AS `remaining_seats`,
    `remaining_seats` + 50 AS `total_seats`,  -- 假设总座位数 = 剩余座位数 + 50（已售出）
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `flights`;

-- ============================================
-- 步骤 4: 为 bookings 表添加 cabin_class 和 updated_at 字段
-- ============================================
ALTER TABLE `bookings` 
ADD COLUMN `cabin_class` VARCHAR(20) NOT NULL DEFAULT 'ECONOMY' COMMENT '舱位等级：ECONOMY-经济舱, BUSINESS-商务舱, FIRST-头等舱' AFTER `user_id`,
ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`;

-- 更新现有 bookings 数据的 cabin_class（默认为 ECONOMY）
UPDATE `bookings` SET `cabin_class` = 'ECONOMY' WHERE `cabin_class` IS NULL OR `cabin_class` = '';

-- 更新现有 bookings 数据的 updated_at
UPDATE `bookings` SET `updated_at` = `created_at` WHERE `updated_at` IS NULL;

-- 为 bookings 表添加索引
ALTER TABLE `bookings` 
ADD INDEX `idx_cabin_class` (`cabin_class`) USING BTREE;

-- ============================================
-- 步骤 5: 删除 flights 表中的 price, remaining_seats, remarks 字段
-- ============================================
ALTER TABLE `flights` 
DROP COLUMN `price`,
DROP COLUMN `remaining_seats`,
DROP COLUMN `remarks`;

-- ============================================
-- 步骤 6: 修改 flights 表的 departure_time 和 arrival_time 字段类型
-- 从 datetime(6) 改为 datetime（如果需要的话，保持一致性）
-- ============================================
-- 注意：如果您的应用需要微秒精度，可以保留 datetime(6)
-- 这里我们保持原样，因为不影响功能

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 验证迁移结果
-- ============================================
-- 检查 flight_seats 表数据
SELECT COUNT(*) AS flight_seats_count FROM `flight_seats`;

-- 检查 bookings 表是否有 cabin_class
SELECT COUNT(*) AS bookings_with_cabin_class FROM `bookings` WHERE `cabin_class` IS NOT NULL;

-- 检查 flights 表是否已删除 price 和 remaining_seats
-- 如果执行成功，以下查询应该报错（字段不存在）
-- SELECT price, remaining_seats FROM flights LIMIT 1;

-- ============================================
-- 迁移完成
-- ============================================

