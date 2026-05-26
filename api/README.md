# API 接口测试指南

## 快速开始

### 1. 启动后端服务

```bash
# 在项目根目录执行
mvn spring-boot:run
```

服务启动后，API 将在 `http://localhost:8080` 上运行。

### 2. 导入 Postman 集合

1. 打开 Postman
2. 点击左上角的 **Import** 按钮
3. 选择 `api/ZJC_Airline_Booking_API.postman_collection.json` 文件
4. 导入成功后，您会看到三个文件夹：
   - 用户管理
   - 航班管理
   - 预订管理

### 3. 配置环境变量

在 Postman 中：
1. 点击右上角的 **Environments**
2. 创建新环境或使用默认的 **Globals**
3. 添加变量：
   - `baseUrl`: `http://localhost:8080`

### 4. 开始测试

#### 测试流程示例：

1. **用户注册**
   - 选择 "用户管理" → "用户注册"
   - 修改请求体中的用户信息
   - 点击 **Send**

2. **用户登录**
   - 选择 "用户管理" → "用户登录"
   - 使用注册的用户名和密码
   - 点击 **Send**
   - 记录返回的 `userId` 和 `token`（如果需要）

3. **查看航班**
   - 选择 "航班管理" → "获取所有航班"
   - 点击 **Send**
   - 记录一个 `flightId` 用于后续测试

4. **创建预订**
   - 选择 "预订管理" → "创建预订"
   - 修改请求体中的 `flightId` 和 `userId`
   - 点击 **Send**

5. **查看预订**
   - 选择 "预订管理" → "获取用户的所有预订"
   - 修改 URL 中的 `userId`
   - 点击 **Send**

## API 接口列表

### 用户管理
- ✅ POST `/api/users/register` - 用户注册
- ✅ POST `/api/users/login` - 用户登录
- ✅ GET `/api/users` - 获取所有用户
- ✅ GET `/api/users/{id}` - 根据ID获取用户
- ✅ PUT `/api/users/{id}` - 更新用户信息
- ✅ DELETE `/api/users/{id}` - 删除用户

### 航班管理
- ✅ GET `/api/flights` - 获取所有航班
- ✅ GET `/api/flights/available` - 获取可用航班
- ✅ GET `/api/flights/{id}` - 根据ID获取航班
- ✅ GET `/api/flights/number/{flightNumber}` - 根据航班号获取航班
- ✅ POST `/api/flights/search` - 搜索航班
- ✅ POST `/api/flights` - 创建航班（管理员）
- ✅ PUT `/api/flights/{id}` - 更新航班（管理员）
- ✅ DELETE `/api/flights/{id}` - 删除航班（管理员）

### 预订管理
- ✅ POST `/api/bookings` - 创建预订
- ✅ GET `/api/bookings` - 获取所有预订
- ✅ GET `/api/bookings/{id}` - 根据ID获取预订
- ✅ GET `/api/bookings/user/{userId}` - 获取用户的所有预订
- ✅ GET `/api/bookings/flight/{flightId}` - 获取航班的预订列表
- ✅ PUT `/api/bookings/{id}/status` - 更新预订状态
- ✅ DELETE `/api/bookings/{id}` - 删除预订

## 测试数据

### 默认测试账户

**管理员：**
- 用户名：`admin`
- 密码：`123456`

**普通用户：**
- 用户名：`zhangsan`, `lisi`, `wangwu` 等
- 密码：`123456`

### 示例航班

- 航班号：`ZJC001` - 北京 → 上海
- 航班号：`ZJC002` - 上海 → 广州
- 航班号：`ZJC003` - 广州 → 深圳

## 常见问题

### 1. 连接被拒绝

**问题：** 无法连接到 `http://localhost:8080`

**解决方案：**
- 确保后端服务已启动
- 检查 `application.properties` 中的端口配置
- 确认 MySQL 数据库已启动并连接成功

### 2. 404 Not Found

**问题：** 接口返回 404 错误

**解决方案：**
- 检查 URL 路径是否正确
- 确认 Controller 的 `@RequestMapping` 路径
- 查看后端日志确认接口是否注册成功

### 3. 400 Bad Request

**问题：** 请求参数错误

**解决方案：**
- 检查请求体的 JSON 格式是否正确
- 确认必填字段是否都已提供
- 查看后端日志中的详细错误信息

### 4. 数据库错误

**问题：** 数据库连接失败或表不存在

**解决方案：**
- 执行 `database/schema.sql` 创建表结构
- 执行 `database/data.sql` 插入示例数据
- 检查 `application.properties` 中的数据库配置

## 使用 Apifox 测试（推荐）

### 快速导入

1. **打开 Apifox**，创建新项目
2. **导入 OpenAPI 文档**：
   - 点击 **导入** → 选择 **OpenAPI/Swagger**
   - 选择文件：`api/openapi.yaml`
   - 点击 **开始导入**
3. **配置环境变量**：
   - 创建环境：`本地开发`
   - 添加变量：`baseUrl = http://localhost:8080`
4. **开始测试**

详细使用指南请查看：**`APIFOX_GUIDE.md`**

### 或者导入 Postman 集合

Apifox 也支持导入 Postman 格式：
- 导入文件：`api/ZJC_Airline_Booking_API.postman_collection.json`

## 使用其他工具测试

### 使用 curl

```bash
# 用户登录
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 获取所有航班
curl http://localhost:8080/api/flights

# 创建预订
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"flightId":1,"userId":1,"ticketCount":2}'
```

### 使用 HTTPie

```bash
# 用户登录
http POST http://localhost:8080/api/users/login username=admin password=123456

# 获取所有航班
http GET http://localhost:8080/api/flights
```

## 下一步

- 查看详细的 API 文档：`API_DOCUMENTATION.md`
- 集成前端：在 Next.js 项目中使用这些 API
- 添加认证：实现 JWT Token 认证机制
- 添加权限控制：基于角色的访问控制（RBAC）

