-- ============================================
-- 为 support_tickets 表添加 user_id 字段和外键约束
-- 关联到 users 表
-- 可直接在 Navicat 中运行
-- ============================================

-- 说明：
-- 1. 如果 user_id 字段已存在，请先删除：ALTER TABLE `support_tickets` DROP COLUMN `user_id`;
-- 2. 如果外键已存在，请先删除：ALTER TABLE `support_tickets` DROP FOREIGN KEY `fk_support_tickets_user_id`;

-- 步骤1：添加 user_id 字段
-- 注意：user_id 允许为 NULL，因为可能存在匿名工单（未登录用户提交的工单）
ALTER TABLE `support_tickets` 
ADD COLUMN `user_id` BIGINT NULL COMMENT '用户ID（关联users表）' AFTER `id`;

-- 步骤2：为 user_id 添加索引（提高查询性能）
ALTER TABLE `support_tickets` 
ADD INDEX `idx_user_id` (`user_id`);

-- 步骤3：添加外键约束
-- ON DELETE SET NULL: 当用户被删除时，工单的 user_id 自动设为 NULL（保留工单记录，但标记为匿名工单）
-- ON UPDATE CASCADE: 当用户ID更新时，工单的 user_id 自动级联更新
ALTER TABLE `support_tickets`
ADD CONSTRAINT `fk_support_tickets_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- 完成提示
SELECT 'support_tickets 表和 users 表之间的外键约束已成功创建！' AS result;
