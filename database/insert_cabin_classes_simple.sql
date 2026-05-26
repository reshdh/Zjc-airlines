-- ============================================
-- 插入商务舱和头等舱数据（简化版本）
-- 直接插入，如果已存在会报错（可忽略）
-- ============================================

USE zjc_airline_booking_db;

-- ZJC001: 北京 -> 上海
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(1, 'BUSINESS', 2200.00, 5, 25),
(1, 'FIRST', 4500.00, 2, 10);

-- ZJC002: 上海 -> 广州
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(2, 'BUSINESS', 2800.00, 4, 25),
(2, 'FIRST', 5500.00, 1, 8);

-- ZJC003: 广州 -> 深圳 (短途，只有商务舱)
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(3, 'BUSINESS', 1200.00, 3, 20);

-- ZJC004: 北京 -> 深圳 (长途)
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(4, 'BUSINESS', 3800.00, 3, 30),
(4, 'FIRST', 8500.00, 1, 10);

-- ZJC005: 上海 -> 成都
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(5, 'BUSINESS', 3000.00, 5, 25),
(5, 'FIRST', 6000.00, 2, 10);

-- ZJC006: 广州 -> 杭州 (短途，只有商务舱)
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(6, 'BUSINESS', 1800.00, 4, 22);

-- ZJC007: 深圳 -> 北京
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(7, 'BUSINESS', 2200.00, 6, 25),
(7, 'FIRST', 4500.00, 1, 8);

-- ZJC008: 成都 -> 上海
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(8, 'BUSINESS', 3000.00, 3, 25),
(8, 'FIRST', 6000.00, 1, 10);

-- ZJC009: 杭州 -> 广州 (短途，只有商务舱)
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(9, 'BUSINESS', 1800.00, 5, 22);

-- ZJC010: 北京 -> 成都 (长途)
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(10, 'BUSINESS', 3500.00, 4, 30),
(10, 'FIRST', 8000.00, 2, 10);

-- ZJC011: 上海 -> 北京
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(11, 'BUSINESS', 2200.00, 5, 25),
(11, 'FIRST', 4500.00, 1, 8);

-- ZJC012: 广州 -> 上海
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(12, 'BUSINESS', 2800.00, 3, 25),
(12, 'FIRST', 5500.00, 1, 8);

-- ZJC013: 深圳 -> 广州 (短途，只有商务舱)
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(13, 'BUSINESS', 1200.00, 4, 20);

-- ZJC014: 成都 -> 北京 (长途)
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(14, 'BUSINESS', 3500.00, 5, 30),
(14, 'FIRST', 8000.00, 2, 10);

-- ZJC015: 杭州 -> 深圳
INSERT IGNORE INTO `flight_seats` (`flight_id`, `cabin_class`, `price`, `remaining_seats`, `total_seats`) VALUES
(15, 'BUSINESS', 2400.00, 4, 25),
(15, 'FIRST', 5000.00, 1, 8);

-- 查看插入结果
SELECT 
    f.flight_number AS '航班号',
    CONCAT(f.origin, ' -> ', f.destination) AS '航线',
    fs.cabin_class AS '舱位',
    CASE fs.cabin_class
        WHEN 'ECONOMY' THEN '经济舱'
        WHEN 'BUSINESS' THEN '商务舱'
        WHEN 'FIRST' THEN '头等舱'
    END AS '舱位名称',
    fs.price AS '价格',
    fs.remaining_seats AS '剩余座位',
    fs.total_seats AS '总座位数'
FROM `flight_seats` fs
JOIN `flights` f ON fs.flight_id = f.id
ORDER BY f.id, 
    CASE fs.cabin_class 
        WHEN 'ECONOMY' THEN 1 
        WHEN 'BUSINESS' THEN 2 
        WHEN 'FIRST' THEN 3 
    END;

