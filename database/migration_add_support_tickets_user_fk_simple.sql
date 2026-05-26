-- ============================================
-- 为 support_tickets 表添加 user_id 字段和外键约束（简化版本）
-- 关联到 users 表
-- 可直接在 Navicat 中运行，每个步骤可单独执行
-- ============================================

-- ============================================
-- 步骤1：添加 user_id 字段（如果不存在，会报错，可忽略）
-- ============================================
ALTER TABLE `support_tickets` 
ADD COLUMN `user_id` BIGINT NULL COMMENT '用户ID（关联users表）' AFTER `id`;

-- ============================================
-- 步骤2：为 user_id 添加索引（如果不存在，会报错，可忽略）
-- ============================================
ALTER TABLE `support_tickets` 
ADD INDEX `idx_user_id` (`user_id`);

-- ============================================
-- 步骤3：删除已存在的外键（如果不存在会报错 1091，可忽略）
-- ============================================
-- 注意：如果外键不存在，会报错 1091，这是正常的，可以忽略
ALTER TABLE `support_tickets` 
DROP FOREIGN KEY `fk_support_tickets_user_id`;

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

