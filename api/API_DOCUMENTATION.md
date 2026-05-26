# ZJC 航空公司机票预订系统 API 文档

## 基础信息

- **Base URL**: `http://localhost:8080`
- **API 前缀**: `/api`
- **Content-Type**: `application/json`
- **字符编码**: UTF-8

## 响应格式

所有 API 响应都遵循统一格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

- `success`: 布尔值，表示操作是否成功
- `message`: 字符串，响应消息
- `data`: 对象，响应数据（可能为 null）

## 用户管理 API

### 1. 用户注册

**POST** `/api/users/register`

**请求体：**
```json
{
  "name": "张三",
  "idNumber": "110101199001011234",
  "phone": "13800138001",
  "address": "北京市朝阳区建国路88号",
  "username": "zhangsan",
  "password": "123456"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": 1,
    "name": "张三",
    "username": "zhangsan",
    "role": "USER"
  }
}
```

### 2. 用户登录

**POST** `/api/users/login`

**请求体：**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "name": "管理员",
      "username": "admin",
      "role": "ADMIN"
    },
    "token": "mock-token-1"
  }
}
```

### 3. 获取所有用户

**GET** `/api/users`

**响应示例：**
```json
{
  "success": true,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "张三",
      "username": "zhangsan",
      "role": "USER"
    }
  ]
}
```

### 4. 根据ID获取用户

**GET** `/api/users/{id}`

**路径参数：**
- `id`: 用户ID

### 5. 更新用户信息

**PUT** `/api/users/{id}`

**请求体：**
```json
{
  "name": "更新后的姓名",
  "phone": "13900139000",
  "address": "更新后的地址"
}
```

### 6. 删除用户

**DELETE** `/api/users/{id}`

## 航班管理 API

### 1. 获取所有航班

**GET** `/api/flights`

### 2. 获取可用航班（有剩余座位）

**GET** `/api/flights/available`

### 3. 根据ID获取航班

**GET** `/api/flights/{id}`

### 4. 根据航班号获取航班

**GET** `/api/flights/number/{flightNumber}`

### 5. 搜索航班

**POST** `/api/flights/search`

**请求体：**
```json
{
  "origin": "北京",
  "destination": "上海"
}
```

**说明：** 可以只提供 `origin` 或 `destination`，也可以两者都提供。

### 6. 创建航班（管理员）

**POST** `/api/flights`

**请求体：**
```json
{
  "flightNumber": "ZJC016",
  "aircraftType": "波音737-800",
  "origin": "北京",
  "destination": "广州",
  "departureTime": "2025-12-06T08:00:00",
  "arrivalTime": "2025-12-06T11:30:00",
  "price": 950.00,
  "remainingSeats": 30,
  "remarks": "经济舱，含餐食"
}
```

**时间格式：** ISO 8601 格式，例如：`2025-12-06T08:00:00`

### 7. 更新航班（管理员）

**PUT** `/api/flights/{id}`

### 8. 删除航班（管理员）

**DELETE** `/api/flights/{id}`

## 预订管理 API

### 1. 创建预订

**POST** `/api/bookings`

**请求体：**
```json
{
  "flightId": 1,
  "userId": 1,
  "ticketCount": 2
}
```

**说明：** 系统会自动计算总金额，并更新航班的剩余座位数。

### 2. 获取所有预订

**GET** `/api/bookings`

### 3. 根据ID获取预订

**GET** `/api/bookings/{id}`

### 4. 获取用户的所有预订

**GET** `/api/bookings/user/{userId}`

### 5. 获取航班的预订列表

**GET** `/api/bookings/flight/{flightId}`

### 6. 更新预订状态

**PUT** `/api/bookings/{id}/status`

**请求体：**
```json
{
  "status": "PAID"
}
```

**状态值：**
- `CREATED`: 已创建（未支付）
- `PAID`: 已支付
- `CANCELED`: 已取消（退票）

**说明：** 取消预订时会自动恢复航班的剩余座位数。

### 7. 删除预订

**DELETE** `/api/bookings/{id}`

**说明：** 删除预订时会自动恢复航班的剩余座位数。

## 错误处理

当请求失败时，响应格式：

```json
{
  "success": false,
  "message": "错误信息",
  "data": null
}
```

**常见错误：**
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权（登录失败）
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 使用 Postman 测试

1. 导入 `ZJC_Airline_Booking_API.postman_collection.json` 文件到 Postman
2. 确保 `baseUrl` 变量设置为 `http://localhost:8080`
3. 启动后端服务：`mvn spring-boot:run`
4. 开始测试各个接口

## 注意事项

1. 所有时间字段使用 ISO 8601 格式
2. 金额字段使用 `DECIMAL(10, 2)` 类型，保留两位小数
3. 密码在数据库中存储为 BCrypt 加密后的哈希值
4. 当前版本未实现 JWT 认证，使用简单的 mock token
5. CORS 已配置为允许所有来源（开发环境）

