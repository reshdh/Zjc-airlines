-- ============================================
-- 继续执行迁移脚本（跳过已存在的列）
-- 适用于已经部分执行过迁移的情况
-- ============================================

USE zjc_airline_booking_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 检查并添加 bookings 表的 updated_at 字段（如果不存在）
-- ============================================
SET @dbname = DATABASE();
SET @tablename = 'bookings';
SET @columnname = 'updated_at';

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT ''列 updated_at 已存在，跳过'' AS message',
    CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间'' AFTER `created_at`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 更新现有 bookings 数据的 cabin_class（如果为空或NULL）
UPDATE `bookings` SET `cabin_class` = 'ECONOMY' WHERE `cabin_class` IS NULL OR `cabin_class` = '';

-- 更新现有 bookings 数据的 updated_at
UPDATE `bookings` SET `updated_at` = `created_at` WHERE `updated_at` IS NULL;

-- 检查并添加 bookings 表的索引（如果不存在）
SET @indexname = 'idx_cabin_class';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (INDEX_NAME = @indexname)
    ) > 0,
    'SELECT ''索引 idx_cabin_class 已存在，跳过'' AS message',
    CONCAT('ALTER TABLE `', @tablename, '` ADD INDEX `', @indexname, '` (`cabin_class`) USING BTREE')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 检查并添加 flights 表的 created_at 和 updated_at 字段（如果不存在）
-- ============================================
SET @tablename = 'flights';
SET @columnname = 'created_at';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT ''列 created_at 已存在，跳过'' AS message',
    CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT ''创建时间'' AFTER `origin`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'updated_at';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT ''列 updated_at 已存在，跳过'' AS message',
    CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间'' AFTER `created_at`')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 更新现有数据的 created_at 和 updated_at
UPDATE `flights` SET `created_at` = NOW(), `updated_at` = NOW() WHERE `created_at` IS NULL OR `updated_at` IS NULL;

-- ============================================
-- 创建 flight_seats 表（如果不存在）
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
-- 将现有 flights 数据迁移到 flight_seats 表（如果还没有迁移）
-- ============================================
INSERT INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`, `created_at`, `updated_at`)
SELECT 
    `id` AS `flight_id`,
    'ECONOMY' AS `cabin_class`,
    `price`,
    `remaining_seats` AS `remaining_seats`,
    `remaining_seats` + 50 AS `total_seats`,
    NOW() AS `created_at`,
    NOW() AS `updated_at`
FROM `flights`
WHERE 
    EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = @dbname 
            AND TABLE_NAME = 'flights' 
            AND COLUMN_NAME = 'price')
    AND NOT EXISTS (
        SELECT 1 FROM `flight_seats` 
        WHERE `flight_seats`.`flight_id` = `flights`.`id` 
        AND `flight_seats`.`cabin_class` = 'ECONOMY'
    );

-- ============================================
-- 删除 flights 表中的旧字段（如果存在）
-- ============================================
SET @tablename = 'flights';

-- 删除 price 列
SET @columnname = 'price';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    CONCAT('ALTER TABLE `', @tablename, '` DROP COLUMN `', @columnname, '`'),
    'SELECT ''列 price 不存在，跳过'' AS message'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 删除 remaining_seats 列
SET @columnname = 'remaining_seats';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    CONCAT('ALTER TABLE `', @tablename, '` DROP COLUMN `', @columnname, '`'),
    'SELECT ''列 remaining_seats 不存在，跳过'' AS message'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 删除 remarks 列
SET @columnname = 'remarks';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    CONCAT('ALTER TABLE `', @tablename, '` DROP COLUMN `', @columnname, '`'),
    'SELECT ''列 remarks 不存在，跳过'' AS message'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 验证迁移结果
-- ============================================
SELECT '迁移完成！' AS message;
SELECT COUNT(*) AS flight_seats_count FROM `flight_seats`;
SELECT COUNT(*) AS bookings_with_cabin_class FROM `bookings` WHERE `cabin_class` IS NOT NULL;


