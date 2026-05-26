# ZJC 航空公司机票预订系统

这是一个早期课程实践项目，也是我第一次使用 AI 编程 IDE 独立完成的完整项目之一。项目以航空公司机票预订为业务背景，包含用户端订票流程、管理员后台、订单与退改签管理、工单反馈、钱包支付模拟和 AI 客服接口接入。

项目中的业务数据均为模拟数据，主要用于课程实验和个人技术成长记录。

## 项目定位

这个仓库更偏向早期实践档案，而不是当前能力代表作。它记录了我从网页端 AI 辅助写代码，过渡到使用 Cursor 这类 AI IDE 完成完整项目的阶段。

## 主要功能

- 用户注册、登录、个人资料维护
- 航班查询、筛选、订票和座位选择
- 订单支付、取消、退票、改签和状态管理
- 用户钱包充值与余额扣减模拟
- 管理员对航班、用户、订单和工单进行管理
- 工单反馈与客服处理流程
- AI 客服入口，后端通过 DeepSeek API 完成对话调用
- REST API 文档、数据库脚本和接口测试集合

## 技术栈

后端使用 Spring Boot 3、Java 17、Spring Data JPA、Spring Security、MySQL 和 Maven。

前端使用 Next.js 14、React 18、TypeScript、Chakra UI、Axios、ECharts、Redux Toolkit 和 Framer Motion。

## 目录结构

```text
.
├── src/                          # Spring Boot 后端
├── zjc-airline-booking-frontend/ # Next.js 前端
├── database/                     # 数据库结构、示例数据和迁移脚本
├── api/                          # API 文档、OpenAPI、Postman/Apifox 示例
├── docs/                         # 项目说明和课程文档
└── pom.xml                       # 后端 Maven 配置
```

## 本地运行

后端需要 Java 17、Maven 和 MySQL。先创建数据库，再导入 `database/schema.sql` 和 `database/data.sql`，然后在项目根目录启动后端。

```bash
./mvnw spring-boot:run
```

前端进入 `zjc-airline-booking-frontend` 后安装依赖并启动。

```bash
npm install
npm run dev
```

前端默认请求 `http://localhost:8080`，可以在 `zjc-airline-booking-frontend/.env.local` 中配置。

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## 环境变量

后端配置支持通过环境变量覆盖数据库和 DeepSeek API 信息。

```bash
DB_URL=jdbc:mysql://localhost:3306/zjc_airline_booking_db?useSSL=false&serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf-8
DB_USERNAME=root
DB_PASSWORD=your_database_password
DEEPSEEK_API_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_API_KEY=your_deepseek_api_key
```

仓库不会提交真实 API Key。没有配置 `DEEPSEEK_API_KEY` 时，AI 客服会返回未配置提示。

## 说明

这是一个课程和早期 vibe coding 实践项目。代码中仍保留了一些早期实现痕迹，例如 mock token、模拟支付、课程式文档和演示数据。保留这些内容是为了记录项目当时的完成状态。
