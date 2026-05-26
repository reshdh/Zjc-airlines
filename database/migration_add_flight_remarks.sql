-- ============================================
-- 数据库迁移脚本：为 flights 表重新添加 remarks 字段
-- 执行日期：2025-11-19
-- 说明：此脚本具备幂等性，重复执行不会报错
-- ============================================

USE zjc_airline_booking_db;

SET FOREIGN_KEY_CHECKS = 0;

SET @dbname = DATABASE();
SET @tablename = 'flights';
SET @columnname = 'remarks';

SET @preparedStatement = (
    SELECT IF(
        (
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = @tablename
              AND COLUMN_NAME = @columnname
        ) > 0,
        'SELECT 1',
        CONCAT(
            'ALTER TABLE `', @tablename,
            '` ADD COLUMN `', @columnname,
            '` VARCHAR(500) NULL DEFAULT NULL COMMENT ''备注信息'' AFTER `origin`'
        )
    )
);

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 验证
-- ============================================
DESCRIBE `flights`;

-- ============================================
-- 迁移完成
-- ============================================




