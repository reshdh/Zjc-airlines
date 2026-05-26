# 数据库初始化说明

本目录包含 ZJC 航空公司机票预订系统的数据库初始化脚本。

## 文件说明

- `schema.sql` - 数据库表结构定义
- `data.sql` - 示例数据（用户、航班、预订记录）

## 使用方法

### 方法一：使用 MySQL 命令行

```bash
# 1. 登录 MySQL
mysql -u root -p

# 2. 执行建表脚本
source database/schema.sql

# 3. 执行数据脚本
source database/data.sql
```

### 方法二：使用 MySQL Workbench 或其他工具

1. 打开 `schema.sql` 文件
2. 执行所有 SQL 语句创建表结构
3. 打开 `data.sql` 文件
4. 执行所有 SQL 语句插入示例数据

### 方法三：使用命令行直接执行

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/data.sql
```

## 数据库配置

确保 `application.properties` 中的数据库配置正确：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/zjc_airline_booking_db?useSSL=false&serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf-8
spring.datasource.username=root
spring.datasource.password=root
```

## 默认账户

### 管理员账户
- 用户名：`admin`
- 密码：`123456`
- 角色：`ADMIN`

### 普通用户账户
- 用户名：`zhangsan`, `lisi`, `wangwu` 等
- 密码：`123456`
- 角色：`USER`

**注意**：示例数据中的密码使用 BCrypt 加密。在实际应用中，应该使用 Spring Security 的 `BCryptPasswordEncoder` 来加密密码。

## 表结构说明

### 1. users（用户表）
- 存储系统用户信息
- 支持普通用户和管理员两种角色
- 包含用户基本信息、登录凭证等

### 2. flights（航班表）
- 存储航班信息
- 包含航班号、出发地、目的地、时间、价格等
- 支持剩余座位数管理

### 3. bookings（预订表）
- 存储用户预订记录
- 关联用户和航班
- 支持多种预订状态（CREATED, PAID, CANCELED）

## 数据说明

- **用户数据**：包含 8 个用户（1 个管理员 + 7 个普通用户）
- **航班数据**：包含 15 条航班记录，覆盖多个城市间的航线
- **预订数据**：包含 15 条预订记录，展示不同状态的预订

## 注意事项

1. 执行脚本前请确保 MySQL 服务已启动
2. 如果数据库已存在，脚本会使用 `CREATE TABLE IF NOT EXISTS` 避免重复创建
3. 密码字段存储的是 BCrypt 加密后的哈希值
4. 时间字段使用 `DATETIME` 类型，时区为 Asia/Shanghai
5. 金额字段使用 `DECIMAL(10, 2)` 确保精度

