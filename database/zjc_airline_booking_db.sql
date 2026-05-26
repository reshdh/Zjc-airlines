/*
 Navicat Premium Dump SQL

 Source Server         : wkkkx
 Source Server Type    : MySQL
 Source Server Version : 90300 (9.3.0)
 Source Host           : localhost:3306
 Source Schema         : zjc_airline_booking_db

 Target Server Type    : MySQL
 Target Server Version : 90300 (9.3.0)
 File Encoding         : 65001

 Date: 18/11/2025 11:27:28
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for bookings
-- ----------------------------
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '订单号',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ticket_count` int NOT NULL,
  `total_amount` decimal(10, 2) NOT NULL,
  `flight_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `cabin_class` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_order_no`(`order_no` ASC) USING BTREE,
  INDEX `FKidcytqkgq0ve4x1elcnbmdy8a`(`flight_id` ASC) USING BTREE,
  INDEX `FKeyog2oic85xg7hsu2je2lx3s6`(`user_id` ASC) USING BTREE,
  INDEX `idx_cabin_class`(`cabin_class` ASC) USING BTREE,
  CONSTRAINT `FKeyog2oic85xg7hsu2je2lx3s6` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FKidcytqkgq0ve4x1elcnbmdy8a` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of bookings
-- ----------------------------
INSERT INTO `bookings` VALUES (1, 'BK20251117000001', 'PAID', 2, 1360.00, 1, 1, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (2, 'BK20251117000002', 'PAID', 1, 850.00, 2, 1, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (3, 'BK20251117000003', 'CREATED', 1, 320.00, 3, 2, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (4, 'BK20251117000004', 'PAID', 2, 2400.00, 4, 3, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (5, 'BK20251117000005', 'PAID', 1, 980.00, 5, 4, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (6, 'BK20251117000006', 'CANCELED', 3, 1650.00, 6, 5, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (7, 'BK20251117000007', 'PAID', 1, 680.00, 7, 6, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (8, 'BK20251117000008', 'CREATED', 2, 1960.00, 8, 7, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (9, 'BK20251117000009', 'PAID', 1, 550.00, 9, 8, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (10, 'BK20251117000010', 'PAID', 1, 1100.00, 10, 1, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (11, 'BK20251117000011', 'PAID', 2, 1360.00, 11, 2, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (12, 'BK20251117000012', 'CREATED', 1, 850.00, 12, 3, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (13, 'BK20251117000013', 'PAID', 1, 320.00, 13, 4, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (14, 'BK20251117000014', 'PAID', 2, 2200.00, 14, 5, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (15, 'BK20251117000015', 'CREATED', 1, 750.00, 15, 6, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (16, 'BK20251117000016', 'CREATED', 9, 6120.00, 1, 10, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (17, 'BK20251117000017', 'CREATED', 6, 4080.00, 1, 10, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (18, 'BK20251117000018', 'CREATED', 6, 5100.00, 2, 10, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (19, 'BK20251117000019', 'CREATED', 2, 1700.00, 2, 10, '2025-11-17 17:00:31', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (20, 'BK20251117000020', 'CREATED', 1, 320.00, 3, 10, '2025-11-17 17:03:13', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (21, 'BK20251117000021', 'CREATED', 2, 1360.00, 1, 11, '2025-11-17 19:41:46', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (22, 'BK20251117000022', 'CREATED', 1, 680.00, 1, 5, '2025-11-17 22:23:51', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (23, 'BK20251117000023', 'CREATED', 1, 680.00, 1, 11, '2025-11-17 22:46:58', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (24, 'BK20251118000024', 'CREATED', 5, 6000.00, 4, 11, '2025-11-18 08:56:36', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (25, 'BK20251118000025', 'CREATED', 1, 680.00, 1, 11, '2025-11-18 09:03:18', '2025-11-18 11:19:50', 'ECONOMY');
INSERT INTO `bookings` VALUES (26, 'BK20251118000026', 'CREATED', 1, 680.00, 1, 11, '2025-11-18 09:03:43', '2025-11-18 11:19:50', 'ECONOMY');

-- ----------------------------
-- Table structure for flight_seats
-- ----------------------------
DROP TABLE IF EXISTS `flight_seats`;
CREATE TABLE `flight_seats`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '舱位ID',
  `flight_id` bigint NOT NULL COMMENT '航班ID',
  `cabin_class` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '舱位等级：ECONOMY-经济舱, BUSINESS-商务舱, FIRST-头等舱',
  `price` decimal(10, 2) NOT NULL COMMENT '该舱位票价',
  `remaining_seats` int NOT NULL DEFAULT 0 COMMENT '该舱位剩余座位数',
  `total_seats` int NOT NULL DEFAULT 0 COMMENT '该舱位总座位数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_flight_cabin`(`flight_id` ASC, `cabin_class` ASC) USING BTREE,
  INDEX `idx_flight_id`(`flight_id` ASC) USING BTREE,
  INDEX `idx_cabin_class`(`cabin_class` ASC) USING BTREE,
  UNIQUE INDEX `UKt9eesssb68yy2ngk4hei8guiw`(`flight_id` ASC, `cabin_class` ASC) USING BTREE,
  CONSTRAINT `fk_flight_seats_flight` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 42 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '航班舱位表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of flight_seats
-- ----------------------------
INSERT INTO `flight_seats` VALUES (1, 1, 'ECONOMY', 680.00, 16, 66, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (2, 2, 'ECONOMY', 850.00, 22, 72, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (3, 3, 'ECONOMY', 320.00, 21, 71, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (4, 4, 'ECONOMY', 1200.00, 0, 50, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (5, 5, 'ECONOMY', 980.00, 12, 62, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (6, 6, 'ECONOMY', 550.00, 18, 68, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (7, 7, 'ECONOMY', 680.00, 20, 70, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (8, 8, 'ECONOMY', 980.00, 10, 60, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (9, 9, 'ECONOMY', 550.00, 25, 75, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (10, 10, 'ECONOMY', 1100.00, 7, 57, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (11, 11, 'ECONOMY', 680.00, 15, 65, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (12, 12, 'ECONOMY', 850.00, 9, 59, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (13, 13, 'ECONOMY', 320.00, 30, 80, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (14, 14, 'ECONOMY', 1100.00, 6, 56, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (15, 15, 'ECONOMY', 750.00, 14, 64, '2025-11-18 10:51:06', '2025-11-18 10:51:06');
INSERT INTO `flight_seats` VALUES (16, 1, 'BUSINESS', 2200.00, 5, 25, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (17, 1, 'FIRST', 4500.00, 2, 10, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (18, 2, 'BUSINESS', 2800.00, 4, 25, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (19, 2, 'FIRST', 5500.00, 1, 8, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (20, 3, 'BUSINESS', 1200.00, 3, 20, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (21, 4, 'BUSINESS', 3800.00, 3, 30, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (22, 4, 'FIRST', 8500.00, 1, 10, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (23, 5, 'BUSINESS', 3000.00, 5, 25, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (24, 5, 'FIRST', 6000.00, 2, 10, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (25, 6, 'BUSINESS', 1800.00, 4, 22, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (26, 7, 'BUSINESS', 2200.00, 6, 25, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (27, 7, 'FIRST', 4500.00, 1, 8, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (28, 8, 'BUSINESS', 3000.00, 3, 25, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (29, 8, 'FIRST', 6000.00, 1, 10, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (30, 9, 'BUSINESS', 1800.00, 5, 22, '2025-11-18 11:04:41', '2025-11-18 11:04:41');
INSERT INTO `flight_seats` VALUES (31, 10, 'BUSINESS', 3500.00, 4, 30, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (32, 10, 'FIRST', 8000.00, 2, 10, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (33, 11, 'BUSINESS', 2200.00, 5, 25, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (34, 11, 'FIRST', 4500.00, 1, 8, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (35, 12, 'BUSINESS', 2800.00, 3, 25, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (36, 12, 'FIRST', 5500.00, 1, 8, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (37, 13, 'BUSINESS', 1200.00, 4, 20, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (38, 14, 'BUSINESS', 3500.00, 5, 30, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (39, 14, 'FIRST', 8000.00, 2, 10, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (40, 15, 'BUSINESS', 2400.00, 4, 25, '2025-11-18 11:04:42', '2025-11-18 11:04:42');
INSERT INTO `flight_seats` VALUES (41, 15, 'FIRST', 5000.00, 1, 8, '2025-11-18 11:04:42', '2025-11-18 11:04:42');

-- ----------------------------
-- Table structure for flights
-- ----------------------------
DROP TABLE IF EXISTS `flights`;
CREATE TABLE `flights`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `aircraft_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `arrival_time` datetime(6) NOT NULL,
  `departure_time` datetime(6) NOT NULL,
  `destination` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `flight_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `origin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK6bx3i9v6ikjiy0ru5ybor8t7`(`flight_number` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of flights
-- ----------------------------
INSERT INTO `flights` VALUES (1, '波音737-800', '2025-12-01 10:30:00.000000', '2025-12-01 08:00:00.000000', '上海', 'ZJC001', '北京', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (2, '空客A320', '2025-12-01 16:45:00.000000', '2025-12-01 14:00:00.000000', '广州', 'ZJC002', '上海', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (3, '波音737-800', '2025-12-01 11:30:00.000000', '2025-12-01 10:30:00.000000', '深圳', 'ZJC003', '广州', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (4, '空客A330', '2025-12-02 12:30:00.000000', '2025-12-02 09:00:00.000000', '深圳', 'ZJC004', '北京', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (5, '波音787', '2025-12-02 14:15:00.000000', '2025-12-02 11:00:00.000000', '成都', 'ZJC005', '上海', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (6, '空客A320', '2025-12-02 15:20:00.000000', '2025-12-02 13:30:00.000000', '杭州', 'ZJC006', '广州', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (7, '波音737-800', '2025-12-03 11:00:00.000000', '2025-12-03 08:30:00.000000', '北京', 'ZJC007', '深圳', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (8, '空客A320', '2025-12-03 18:15:00.000000', '2025-12-03 15:00:00.000000', '上海', 'ZJC008', '成都', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (9, '波音737-800', '2025-12-03 17:50:00.000000', '2025-12-03 16:00:00.000000', '广州', 'ZJC009', '杭州', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (10, '空客A330', '2025-12-04 13:30:00.000000', '2025-12-04 10:00:00.000000', '成都', 'ZJC010', '北京', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (11, '波音787', '2025-12-04 16:30:00.000000', '2025-12-04 14:00:00.000000', '北京', 'ZJC011', '上海', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (12, '空客A320', '2025-12-04 19:45:00.000000', '2025-12-04 17:00:00.000000', '上海', 'ZJC012', '广州', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (13, '波音737-800', '2025-12-05 10:30:00.000000', '2025-12-05 09:30:00.000000', '广州', 'ZJC013', '深圳', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (14, '空客A330', '2025-12-05 14:30:00.000000', '2025-12-05 11:00:00.000000', '北京', 'ZJC014', '成都', '2025-11-18 10:49:56', '2025-11-18 10:49:56');
INSERT INTO `flights` VALUES (15, '波音787', '2025-12-05 15:30:00.000000', '2025-12-05 13:00:00.000000', '深圳', 'ZJC015', '杭州', '2025-11-18 10:49:56', '2025-11-18 10:49:56');

-- ----------------------------
-- Table structure for support_tickets
-- ----------------------------
DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE `support_tickets`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '工单ID',
  `subject` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '工单主题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '提交人姓名',
  `contact_info` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系方式',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN' COMMENT '状态：OPEN/IN_PROGRESS/RESOLVED/CLOSED',
  `priority` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMAL' COMMENT '优先级：LOW/NORMAL/HIGH/URGENT',
  `admin_reply` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_priority`(`priority` ASC) USING BTREE,
  INDEX `idx_created_at_support`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户服务工单' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of support_tickets
-- ----------------------------
INSERT INTO `support_tickets` VALUES (1, '无法完成支付', '我在支付订单 ZJC001 时提示失败，请协助解决。', '张三', 'zhangsan@example.com', 'OPEN', 'HIGH', NULL, '2025-11-17 21:50:40', '2025-11-17 21:50:40');
INSERT INTO `support_tickets` VALUES (2, '需要发票', '订单 ZJC005 需要开具增值税发票，请问怎么操作？', '李四', '13800138002', 'IN_PROGRESS', 'NORMAL', '已转财务处理', '2025-11-17 21:50:40', '2025-11-17 21:50:40');
INSERT INTO `support_tickets` VALUES (3, '航班延误补偿咨询', '航班 ZJC004 延误了两个小时，是否有补偿政策？', '王五', 'wangwu@example.com', 'RESOLVED', 'LOW', '您好，已为您申请代金券补偿，请注意查收短信。', '2025-11-17 21:50:40', '2025-11-17 21:50:40');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `id_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UKpj11kyelx55icfcq5v6dpvw7v`(`id_number` ASC) USING BTREE,
  UNIQUE INDEX `UKr43af9ap4edm43mmtq01oddj6`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, '北京市朝阳区建国路88号', '110101199001011234', '张三', '$2b$12$uECSUQT520fV7yiylThGiuwl6Uuv4wtBc7hd87iZblEBBnIOpMibS', '13800138001', 'USER', 1, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'zhangsan');
INSERT INTO `users` VALUES (2, '上海市浦东新区陆家嘴环路1000号', '110101199002021234', '李四', '$2a$10$hN3LAwrvnAlms/MvDjO3V.ShM.FWfffOIOHQdBOsa/NS4TjpcnTWK', '13800138002', 'USER', 1, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'lisi');
INSERT INTO `users` VALUES (3, '广州市天河区天河路123号', '110101199003031234', '王五', '$2a$10$hN3LAwrvnAlms/MvDjO3V.ShM.FWfffOIOHQdBOsa/NS4TjpcnTWK', '13800138003', 'USER', 0, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'wangwu');
INSERT INTO `users` VALUES (4, '深圳市南山区科技园南路1000号', '110101199004041234', '赵六', '$2a$10$hN3LAwrvnAlms/MvDjO3V.ShM.FWfffOIOHQdBOsa/NS4TjpcnTWK', '13800138004', 'USER', 0, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'zhaoliu');
INSERT INTO `users` VALUES (5, '北京市海淀区中关村大街1号', '110101199000001234', '管理员', '$2b$12$uECSUQT520fV7yiylThGiuwl6Uuv4wtBc7hd87iZblEBBnIOpMibS', '13800138000', 'ADMIN', 1, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'admin');
INSERT INTO `users` VALUES (6, '杭州市西湖区文三路259号', '110101199005051234', '刘七', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pQ1O', '13800138005', 'USER', 1, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'liuqi');
INSERT INTO `users` VALUES (7, '成都市锦江区春熙路123号', '110101199006061234', '陈八', '$2a$10$hN3LAwrvnAlms/MvDjO3V.ShM.FWfffOIOHQdBOsa/NS4TjpcnTWK', '13800138006', 'USER', 1, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'chenba');
INSERT INTO `users` VALUES (8, '武汉市洪山区珞喻路461号', '110101199007071234', '周九', '$2a$10$hN3LAwrvnAlms/MvDjO3V.ShM.FWfffOIOHQdBOsa/NS4TjpcnTWK', '13800138007', 'USER', 1, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'zhoujiu');
INSERT INTO `users` VALUES (9, 'sdfajgkjsdgj', '110101199001011235', '陈冠希', '$2a$10$hN3LAwrvnAlms/MvDjO3V.ShM.FWfffOIOHQdBOsa/NS4TjpcnTWK', '18067293887', 'USER', 1, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'testuser03');
INSERT INTO `users` VALUES (10, 'sssssssss', '110101199002021238', '晚上是', '$2a$10$hN3LAwrvnAlms/MvDjO3V.ShM.FWfffOIOHQdBOsa/NS4TjpcnTWK', '13800138009', 'USER', 1, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'testuser004');
INSERT INTO `users` VALUES (11, 'asgfsa asdg ', '110101199001011239', '伟大的', '$2a$10$hN3LAwrvnAlms/MvDjO3V.ShM.FWffFOI0HQdBOsa/NS4TjpcnTWK', '13800138012', 'USER', 1, '2025-11-17 23:15:26', '2025-11-17 23:15:26', 'testuser005');

SET FOREIGN_KEY_CHECKS = 1;
