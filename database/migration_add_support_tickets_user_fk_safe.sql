-- ============================================
-- 为 support_tickets 表添加 user_id 字段和外键约束（安全版本）
-- 关联到 users 表
-- 可直接在 Navicat 中运行，可重复执行
-- ============================================

-- 使用存储过程来检查并执行，避免重复执行报错

DELIMITER $$

DROP PROCEDURE IF EXISTS `add_support_tickets_user_fk`$$

CREATE PROCEDURE `add_support_tickets_user_fk`()
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    DECLARE fk_exists INT DEFAULT 0;
    DECLARE index_exists INT DEFAULT 0;
    
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
        SELECT 'user_id 字段已存在，跳过添加' AS result;
    END IF;
    
    -- 检查索引是否存在
    SELECT COUNT(*) INTO index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'support_tickets'
      AND INDEX_NAME = 'idx_user_id';
    
    -- 再次确认字段是否存在（防止字段添加失败的情况）
    SELECT COUNT(*) INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'support_tickets'
      AND COLUMN_NAME = 'user_id';
    
    -- 如果字段仍然不存在，报错并退出
    IF column_exists = 0 THEN
        SELECT '错误：user_id 字段不存在，无法添加外键约束！请先添加 user_id 字段。' AS error;
    ELSE
        -- 如果索引不存在，则添加
        IF index_exists = 0 THEN
            ALTER TABLE `support_tickets` 
            ADD INDEX `idx_user_id` (`user_id`);
            SELECT '索引 idx_user_id 已添加' AS result;
        ELSE
            SELECT '索引 idx_user_id 已存在，跳过添加' AS result;
        END IF;
        
        -- 检查外键是否存在
        SELECT COUNT(*) INTO fk_exists
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'support_tickets'
          AND CONSTRAINT_NAME = 'fk_support_tickets_user_id'
          AND REFERENCED_TABLE_NAME IS NOT NULL;
        
        -- 如果外键已存在，先删除
        IF fk_exists > 0 THEN
            ALTER TABLE `support_tickets` 
            DROP FOREIGN KEY `fk_support_tickets_user_id`;
            SELECT '已删除旧的外键约束' AS result;
        END IF;
        
        -- 添加外键约束
        -- 说明：ON DELETE SET NULL - 当用户被删除时，工单的user_id设为NULL（保留匿名工单）
        --      ON UPDATE CASCADE - 当用户ID更新时，工单的user_id自动级联更新
        ALTER TABLE `support_tickets`
        ADD CONSTRAINT `fk_support_tickets_user_id`
            FOREIGN KEY (`user_id`)
            REFERENCES `users` (`id`)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
        
        SELECT '外键约束 fk_support_tickets_user_id 已成功创建！' AS final_result;
    END IF;
    

END$$

DELIMITER ;

-- 执行存储过程
CALL `add_support_tickets_user_fk`();

-- 清理存储过程（可选）
DROP PROCEDURE IF EXISTS `add_support_tickets_user_fk`;

-- 完成提示
SELECT 'support_tickets 表和 users 表之间的外键约束已成功创建！' AS result;

