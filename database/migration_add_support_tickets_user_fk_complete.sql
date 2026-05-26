-- ============================================
-- 为 support_tickets 表添加 user_id 字段和外键约束（完整版本）
-- 关联到 users 表
-- 可直接在 Navicat 中运行，请按顺序执行所有步骤
-- ============================================

-- ============================================
-- 步骤1：检查并添加 user_id 字段
-- ============================================
-- 使用存储过程安全添加字段（如果不存在）
DELIMITER $$

DROP PROCEDURE IF EXISTS `add_column_if_not_exists`$$

CREATE PROCEDURE `add_column_if_not_exists`()
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    -- 检查 user_id 字段是否存在
    SELECT COUNT(*) INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'support_tickets'
      AND COLUMN_NAME = 'user_id';
    
    -- 如果字段不存在，则添加
    IF column_exists = 0 THEN
        ALTER TABLE `support_tickets` 
        ADD COLUMN `user_id` BIGINT NULL COMMENT '用户ID（关联users表）' AFTER `id`;
        SELECT 'user_id 字段已添加' AS result;
    ELSE
        SELECT 'user_id 字段已存在，跳过添加（这是正常的）' AS result;
    END IF;
END$$

DELIMITER ;

-- 执行存储过程添加字段（如果不存在）
CALL `add_column_if_not_exists`();

-- 清理存储过程
DROP PROCEDURE IF EXISTS `add_column_if_not_exists`;

-- ============================================
-- 步骤2：为 user_id 添加索引
-- ============================================
-- 使用存储过程安全添加索引（如果不存在）
DELIMITER $$

DROP PROCEDURE IF EXISTS `add_index_if_not_exists`$$

CREATE PROCEDURE `add_index_if_not_exists`()
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    -- 检查索引是否存在
    SELECT COUNT(*) INTO index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'support_tickets'
      AND INDEX_NAME = 'idx_user_id';
    
    -- 如果索引不存在，则添加
    IF index_exists = 0 THEN
        ALTER TABLE `support_tickets` 
        ADD INDEX `idx_user_id` (`user_id`);
        SELECT '索引 idx_user_id 已添加' AS result;
    ELSE
        SELECT '索引 idx_user_id 已存在，跳过添加（这是正常的）' AS result;
    END IF;
END$$

DELIMITER ;

-- 执行存储过程添加索引（如果不存在）
CALL `add_index_if_not_exists`();

-- 清理存储过程
DROP PROCEDURE IF EXISTS `add_index_if_not_exists`;

-- ============================================
-- 步骤3：删除已存在的外键（如果存在）
-- ============================================
-- 注意：如果外键不存在，会报错 1091，这是正常的，可以忽略
-- 如果您想避免错误，可以先检查：
-- SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets' 
-- AND CONSTRAINT_NAME = 'fk_support_tickets_user_id' AND REFERENCED_TABLE_NAME IS NOT NULL;
-- 如果返回 0，说明外键不存在，可以跳过此步骤

-- 使用存储过程安全删除外键（如果存在）
DELIMITER $$

DROP PROCEDURE IF EXISTS `drop_fk_if_exists`$$

CREATE PROCEDURE `drop_fk_if_exists`()
BEGIN
    DECLARE fk_exists INT DEFAULT 0;
    
    -- 检查外键是否存在
    SELECT COUNT(*) INTO fk_exists
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'support_tickets'
      AND CONSTRAINT_NAME = 'fk_support_tickets_user_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL;
    
    -- 如果外键存在，则删除
    IF fk_exists > 0 THEN
        ALTER TABLE `support_tickets` 
        DROP FOREIGN KEY `fk_support_tickets_user_id`;
        SELECT '已删除旧的外键约束' AS result;
    ELSE
        SELECT '外键不存在，跳过删除（这是正常的）' AS result;
    END IF;
END$$

DELIMITER ;

-- 执行存储过程删除外键（如果存在）
CALL `drop_fk_if_exists`();

-- 清理存储过程
DROP PROCEDURE IF EXISTS `drop_fk_if_exists`;

-- ============================================
-- 步骤4：添加外键约束
-- ============================================
-- 说明：
-- - ON DELETE SET NULL: 当用户被删除时，工单的 user_id 自动设为 NULL（保留工单记录，标记为匿名工单）
-- - ON UPDATE CASCADE: 当用户ID更新时，工单的 user_id 自动级联更新
ALTER TABLE `support_tickets`
ADD CONSTRAINT `fk_support_tickets_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ============================================
-- 完成提示
-- ============================================
SELECT 'support_tickets 表和 users 表之间的外键约束已成功创建！' AS result;

