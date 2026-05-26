# ZJC 航空公司机票预订系统

这是一个基于 **Spring Boot + Next.js + MySQL** 的 ZJC 航空公司机票预订系统，支持：

- 航班信息查看（航班号、机型、出发地、目的地、时间、票价、剩余票数、备注）
- 用户注册与登录
- 机票预订与总金额计算
- 订票单管理（查看、修改、增加、退票）
- 管理员登录后维护航班信息（新增、修改、删除）

## 运行说明

1. 启动 MySQL 数据库服务，并创建数据库：`zjc_airline_booking_db`（字符集建议使用 UTF-8）。
2. 在后端项目 `application.properties` 中配置正确的数据库用户名与密码。
3. 在后端目录下运行：

```bash
mvn spring-boot:run
```

4. 在前端目录 `zjc-airline-booking-frontend` 下安装依赖并启动开发服务器：

```bash
npm install
npm run dev
```

5. 默认端口：

- 前端：`http://localhost:3000`（Next.js 默认端口，可按需改为 8000）
- 后端：`http://localhost:8080`（Spring Boot 默认端口）
    