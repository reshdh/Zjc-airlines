# ZJC航空公司预订系统 API 接口地址

## 基础地址
```
http://localhost:8080
```

## 航班管理接口

### 1. 获取所有航班
```
GET http://localhost:8080/api/flights
```

### 2. 获取可用航班（有剩余座位）
```
GET http://localhost:8080/api/flights/available
```

### 3. 根据ID获取航班详情
```
GET http://localhost:8080/api/flights/1
```

### 4. 根据航班号获取航班
```
GET http://localhost:8080/api/flights/number/ZJC001
```

### 5. 搜索航班
```
POST http://localhost:8080/api/flights/search
Content-Type: application/json

请求体：
{
  "origin": "北京",
  "destination": "上海"
}
```

### 6. 获取推荐航班
```
GET http://localhost:8080/api/flights/recommendations?limit=3
```

## 订单管理接口

### 1. 获取所有订单
```
GET http://localhost:8080/api/bookings
```

### 2. 获取最近订单
```
GET http://localhost:8080/api/bookings/recent?limit=6
```

### 3. 根据ID获取订单
```
GET http://localhost:8080/api/bookings/1
```

### 4. 获取用户的所有订单
```
GET http://localhost:8080/api/bookings/user/1
```

### 5. 获取航班的订单列表
```
GET http://localhost:8080/api/bookings/flight/1
```

### 6. 创建订单
```
POST http://localhost:8080/api/bookings
Content-Type: application/json

请求体：
{
  "flightId": 1,
  "userId": 1,
  "cabinClass": "ECONOMY",
  "ticketCount": 2
}
```

### 7. 更新订单状态
```
PUT http://localhost:8080/api/bookings/1/status
Content-Type: application/json

请求体：
{
  "status": "PAID"
}
```

### 8. 删除订单
```
DELETE http://localhost:8080/api/bookings/1
```

## 快速测试地址（可直接在浏览器打开）

### 获取所有航班
```
http://localhost:8080/api/flights
```

### 获取可用航班
```
http://localhost:8080/api/flights/available
```

### 获取航班ID为1的详情
```
http://localhost:8080/api/flights/1
```

### 根据航班号查询
```
http://localhost:8080/api/flights/number/ZJC001
```

### 获取推荐航班
```
http://localhost:8080/api/flights/recommendations?limit=3
```

### 获取所有订单
```
http://localhost:8080/api/bookings
```

### 获取订单ID为1的详情
```
http://localhost:8080/api/bookings/1
```

### 获取用户ID为1的所有订单
```
http://localhost:8080/api/bookings/user/1
```

### 获取航班ID为1的所有订单
```
http://localhost:8080/api/bookings/flight/1
```

## 注意事项

1. **确保后端服务已启动**：接口地址为 `http://localhost:8080`
2. **POST/PUT 请求**：需要在 Postman 或其他 API 工具中测试，浏览器无法直接发送 POST 请求体
3. **日期格式**：搜索航班时，日期格式为 `yyyy-MM-dd'T'HH:mm:ss`，例如：`2025-12-01T08:00:00`
4. **舱位等级**：创建订单时，`cabinClass` 可选值：`ECONOMY`（经济舱）、`BUSINESS`（商务舱）、`FIRST`（头等舱）

## 测试数据

- **测试航班ID**: 1, 2, 3
- **测试航班号**: ZJC001, ZJC002, ZJC003
- **测试用户ID**: 1, 2, 3
- **测试订单ID**: 1, 2, 3


