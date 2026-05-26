# ZJC航空公司预订系统 API V2 接口文档

## 概述

本文档基于新的数据库结构，包含舱位等级（ECONOMY、BUSINESS、FIRST）和订单号（order_no）功能。

## 导入 Postman Collection

1. 打开 Postman
2. 点击左上角 "Import" 按钮
3. 选择文件 `ZJC_Airline_Booking_API_V2.postman_collection.json`
4. 导入成功后，可以在左侧看到 "ZJC航空公司预订系统 API V2" 集合

## 环境变量配置

Collection 中已配置环境变量：
- `baseUrl`: `http://localhost:8080`

如需修改，可以在 Postman 中：
1. 点击集合名称
2. 选择 "Variables" 标签
3. 修改 `baseUrl` 的值

## 数据库结构说明

### 航班表 (flights)
- 不再包含 `price` 和 `remaining_seats` 字段
- 这些信息现在存储在 `flight_seats` 表中

### 航班舱位表 (flight_seats)
- `flight_id`: 航班ID
- `cabin_class`: 舱位等级（ECONOMY、BUSINESS、FIRST）
- `price`: 该舱位票价
- `remaining_seats`: 该舱位剩余座位数
- `total_seats`: 该舱位总座位数

### 订单表 (bookings)
- `order_no`: 订单号（格式：BK+日期+序号，如 BK20251117000001）
- `cabin_class`: 舱位等级（ECONOMY、BUSINESS、FIRST）
- `status`: 订单状态（CREATED、PAID、CANCELED）

## API 接口列表

### 航班管理

#### 1. 获取所有航班
- **方法**: `GET`
- **路径**: `/api/flights`
- **说明**: 返回所有航班列表，包含每个航班的舱位信息

#### 2. 获取可用航班
- **方法**: `GET`
- **路径**: `/api/flights/available`
- **说明**: 返回有剩余座位的航班（至少有一个舱位有剩余座位）

#### 3. 根据ID获取航班
- **方法**: `GET`
- **路径**: `/api/flights/{id}`
- **示例**: `/api/flights/1`
- **说明**: 返回指定航班的详细信息，包含所有舱位信息

#### 4. 根据航班号获取航班
- **方法**: `GET`
- **路径**: `/api/flights/number/{flightNumber}`
- **示例**: `/api/flights/number/ZJC001`

#### 5. 搜索航班
- **方法**: `POST`
- **路径**: `/api/flights/search`
- **请求体**:
```json
{
  "origin": "北京",
  "destination": "上海",
  "departureDate": "2025-12-01T08:00:00"
}
```
- **说明**: 
  - 所有字段都是可选的
  - `departureDate` 格式：`yyyy-MM-dd'T'HH:mm:ss`
  - 可以只提供 `origin` 或 `destination`，也可以两者都提供
  - 空请求体 `{}` 会返回所有可用航班

#### 6. 获取推荐航班
- **方法**: `GET`
- **路径**: `/api/flights/recommendations`
- **查询参数**: `limit` (默认: 3)

#### 7. 创建航班（管理员）
- **方法**: `POST`
- **路径**: `/api/flights`
- **请求体**:
```json
{
  "flightNumber": "ZJC016",
  "aircraftType": "波音737-800",
  "origin": "北京",
  "destination": "广州",
  "departureTime": "2025-12-06T08:00:00",
  "arrivalTime": "2025-12-06T11:30:00",
  "seats": [
    {
      "cabinClass": "ECONOMY",
      "price": 950.00,
      "remainingSeats": 30,
      "totalSeats": 50
    },
    {
      "cabinClass": "BUSINESS",
      "price": 2500.00,
      "remainingSeats": 10,
      "totalSeats": 20
    },
    {
      "cabinClass": "FIRST",
      "price": 5000.00,
      "remainingSeats": 5,
      "totalSeats": 10
    }
  ]
}
```
- **说明**: 创建航班时需要同时创建舱位信息，`seats` 数组包含所有舱位

#### 8. 更新航班（管理员）
- **方法**: `PUT`
- **路径**: `/api/flights/{id}`
- **说明**: 只能更新航班基本信息，不能更新舱位信息

#### 9. 删除航班（管理员）
- **方法**: `DELETE`
- **路径**: `/api/flights/{id}`
- **说明**: 删除航班会级联删除所有舱位信息

### 订单管理

#### 1. 创建订单
- **方法**: `POST`
- **路径**: `/api/bookings`
- **请求体**:
```json
{
  "flightId": 1,
  "userId": 1,
  "cabinClass": "ECONOMY",
  "ticketCount": 2
}
```
- **说明**: 
  - `cabinClass` 可选值：`ECONOMY`（经济舱）、`BUSINESS`（商务舱）、`FIRST`（头等舱）
  - 系统会自动生成订单号（格式：BK+日期+序号）
  - 系统会自动计算总金额（根据舱位价格 × 票数）
  - 系统会自动更新对应舱位的剩余座位数

#### 2. 获取所有订单
- **方法**: `GET`
- **路径**: `/api/bookings`
- **说明**: 返回所有订单，包含订单号、舱位等级等信息

#### 3. 获取最近订单
- **方法**: `GET`
- **路径**: `/api/bookings/recent`
- **查询参数**: `limit` (默认: 6)

#### 4. 根据ID获取订单
- **方法**: `GET`
- **路径**: `/api/bookings/{id}`
- **说明**: 返回订单详细信息，包含订单号、舱位等级等

#### 5. 获取用户的所有订单
- **方法**: `GET`
- **路径**: `/api/bookings/user/{userId}`
- **示例**: `/api/bookings/user/1`

#### 6. 获取航班的订单列表
- **方法**: `GET`
- **路径**: `/api/bookings/flight/{flightId}`
- **示例**: `/api/bookings/flight/1`

#### 7. 更新订单状态
- **方法**: `PUT`
- **路径**: `/api/bookings/{id}/status`
- **请求体**:
```json
{
  "status": "PAID"
}
```
- **状态值**:
  - `CREATED`: 已创建（待支付）
  - `PAID`: 已支付
  - `CANCELED`: 已取消（退票）
- **说明**: 取消订单时，系统会自动恢复对应舱位的剩余座位数

#### 8. 删除订单
- **方法**: `DELETE`
- **路径**: `/api/bookings/{id}`
- **说明**: 删除订单时，系统会自动恢复对应舱位的剩余座位数

## 响应格式

所有接口统一使用以下响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 成功响应示例

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "orderNo": "BK20251117000001",
    "flight": {
      "id": 1,
      "flightNumber": "ZJC001",
      "origin": "北京",
      "destination": "上海",
      "departureTime": "2025-12-01T08:00:00",
      "arrivalTime": "2025-12-01T10:30:00",
      "seats": [
        {
          "id": 1,
          "cabinClass": "ECONOMY",
          "price": 680.00,
          "remainingSeats": 16,
          "totalSeats": 66
        },
        {
          "id": 16,
          "cabinClass": "BUSINESS",
          "price": 2200.00,
          "remainingSeats": 5,
          "totalSeats": 25
        },
        {
          "id": 17,
          "cabinClass": "FIRST",
          "price": 4500.00,
          "remainingSeats": 2,
          "totalSeats": 10
        }
      ]
    },
    "user": {
      "id": 1,
      "username": "zhangsan",
      "name": "张三"
    },
    "cabinClass": "ECONOMY",
    "ticketCount": 2,
    "totalAmount": 1360.00,
    "status": "PAID",
    "createdAt": "2025-11-17T17:00:31"
  }
}
```

### 错误响应示例

```json
{
  "code": 400,
  "message": "该舱位剩余座位不足",
  "data": null
}
```

## 测试数据

### 测试用户
- 用户ID: 1, 用户名: `zhangsan`, 密码: `123456`
- 用户ID: 2, 用户名: `lisi`, 密码: `123456`
- 管理员: 用户ID: 5, 用户名: `admin`, 密码: `123456`

### 测试航班
- 航班ID: 1, 航班号: `ZJC001`, 北京 → 上海
- 航班ID: 2, 航班号: `ZJC002`, 上海 → 广州
- 航班ID: 3, 航班号: `ZJC003`, 广州 → 深圳

### 舱位等级说明
- `ECONOMY`: 经济舱
- `BUSINESS`: 商务舱
- `FIRST`: 头等舱

## 注意事项

1. **日期格式**: 所有日期时间字段使用 ISO 8601 格式：`yyyy-MM-dd'T'HH:mm:ss`
2. **订单号**: 系统自动生成，格式为 `BK` + 日期（yyyyMMdd）+ 6位序号
3. **舱位价格**: 每个舱位等级有独立的价格，创建订单时根据选择的舱位计算总金额
4. **座位管理**: 每个舱位等级的座位数独立管理，互不影响
5. **订单取消**: 取消订单或删除订单时，系统会自动恢复对应舱位的剩余座位数

## 常见问题

### 1. 如何查询某个航班的所有舱位信息？
使用 `GET /api/flights/{id}` 接口，返回的 `data.seats` 数组包含所有舱位信息。

### 2. 如何知道某个航班还有哪些舱位有剩余座位？
使用 `GET /api/flights/{id}` 接口，查看 `seats` 数组中每个舱位的 `remainingSeats` 字段。

### 3. 创建订单时如何选择舱位？
在请求体的 `cabinClass` 字段中指定：`ECONOMY`、`BUSINESS` 或 `FIRST`。

### 4. 订单号在哪里？
订单号在创建订单后的响应中，字段名为 `orderNo`。

### 5. 如何查询某个用户的所有订单？
使用 `GET /api/bookings/user/{userId}` 接口。


