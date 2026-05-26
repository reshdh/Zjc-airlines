# Apifox 使用指南

## 导入 API 文档到 Apifox

### 方法一：导入 OpenAPI 规范（推荐）

1. **打开 Apifox**
   - 启动 Apifox 应用程序

2. **创建新项目**
   - 点击左上角的 **项目** → **新建项目**
   - 项目名称：`ZJC 航空公司机票预订系统`
   - 点击 **确定**

3. **导入 OpenAPI 文档**
   - 在项目中，点击 **导入** 按钮
   - 选择 **OpenAPI/Swagger**
   - 选择文件：`api/openapi.yaml`
   - 点击 **开始导入**

4. **导入完成**
   - Apifox 会自动解析所有接口
   - 生成完整的接口文档和测试用例

### 方法二：导入 Postman 集合

1. **导入 Postman 集合**
   - 在 Apifox 中点击 **导入**
   - 选择 **Postman**
   - 选择文件：`api/ZJC_Airline_Booking_API.postman_collection.json`
   - 点击 **开始导入**

2. **配置环境变量**
   - 点击左侧的 **环境管理**
   - 创建新环境：`本地开发`
   - 添加变量：
     - `baseUrl`: `http://localhost:8080`
   - 保存环境

## 配置环境变量

### 创建环境

1. 点击左侧的 **环境管理**
2. 点击 **新建环境**
3. 环境名称：`本地开发`
4. 添加以下变量：

| 变量名 | 初始值 | 当前值 |
|--------|--------|--------|
| baseUrl | http://localhost:8080 | http://localhost:8080 |

### 使用环境

- 在接口请求中，使用 `{{baseUrl}}` 引用变量
- 可以在不同环境间快速切换

## 测试接口

### 1. 启动后端服务

```bash
# 在项目根目录执行
mvn spring-boot:run
```

### 2. 测试流程

#### 步骤 1：用户注册

1. 在 Apifox 中找到 **用户管理** → **用户注册**
2. 修改请求体：
```json
{
  "name": "测试用户",
  "idNumber": "110101199001011111",
  "phone": "13800138000",
  "address": "北京市朝阳区测试地址",
  "username": "testuser",
  "password": "123456"
}
```
3. 点击 **发送**
4. 记录返回的 `userId`

#### 步骤 2：用户登录

1. 选择 **用户管理** → **用户登录**
2. 修改请求体：
```json
{
  "username": "admin",
  "password": "123456"
}
```
3. 点击 **发送**
4. 查看返回的用户信息和 token

#### 步骤 3：查看航班

1. 选择 **航班管理** → **获取所有航班**
2. 点击 **发送**
3. 从返回结果中记录一个 `flightId`

#### 步骤 4：创建预订

1. 选择 **预订管理** → **创建预订**
2. 修改请求体，使用之前记录的 `userId` 和 `flightId`：
```json
{
  "flightId": 1,
  "userId": 1,
  "ticketCount": 2
}
```
3. 点击 **发送**
4. 查看预订结果和总金额

#### 步骤 5：查看预订

1. 选择 **预订管理** → **获取用户的所有预订**
2. 修改 URL 中的 `userId` 参数
3. 点击 **发送**

## Apifox 特色功能

### 1. 自动生成测试用例

Apifox 会根据 OpenAPI 规范自动生成测试用例，包括：
- 正常情况测试
- 边界值测试
- 错误情况测试

### 2. 数据模型管理

- 在 **数据模型** 中可以查看所有数据结构的定义
- 支持数据模型的复用和引用

### 3. 前置/后置脚本

可以为接口添加前置和后置脚本：

**前置脚本示例（自动设置 token）：**
```javascript
// 从环境变量获取 token
const token = pm.environment.get("token");
if (token) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + token
    });
}
```

**后置脚本示例（保存 token）：**
```javascript
// 保存登录返回的 token
const response = pm.response.json();
if (response.success && response.data.token) {
    pm.environment.set("token", response.data.token);
}
```

### 4. 接口文档自动生成

- Apifox 会根据 OpenAPI 规范自动生成美观的接口文档
- 支持在线分享和导出

### 5. Mock 数据

- 可以为接口配置 Mock 数据
- 支持动态生成测试数据

## 常用操作

### 批量测试

1. 选择多个接口
2. 右键 → **批量运行**
3. 配置运行顺序和依赖关系
4. 点击 **运行**

### 导出文档

1. 选择项目
2. 点击 **导出**
3. 选择导出格式（Markdown、HTML、PDF等）
4. 点击 **导出**

### 分享接口

1. 选择接口或项目
2. 点击 **分享**
3. 生成分享链接
4. 发送给团队成员

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

### 1. 导入失败

**问题：** OpenAPI 文件导入失败

**解决方案：**
- 检查 YAML 文件格式是否正确
- 确保文件编码为 UTF-8
- 查看 Apifox 的错误提示

### 2. 环境变量不生效

**问题：** 使用 `{{baseUrl}}` 但变量未替换

**解决方案：**
- 确保已选择正确的环境
- 检查环境变量名称是否拼写正确
- 重新保存环境配置

### 3. 请求失败

**问题：** 接口返回错误

**解决方案：**
- 检查后端服务是否启动
- 查看请求 URL 是否正确
- 检查请求体格式
- 查看后端日志

## 更多资源

- [Apifox 官方文档](https://apifox.com/help)
- [OpenAPI 规范文档](https://swagger.io/specification/)
- API 详细文档：`API_DOCUMENTATION.md`

