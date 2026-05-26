-- 为用户表新增钱包余额列，并为现有用户初始化默认金额
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT 200.00;

-- 管理员钱包余额设为 0
UPDATE users
SET wallet_balance = 0.00
WHERE UPPER(role) = 'ADMIN';




