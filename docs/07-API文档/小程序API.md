# 📱 小程序API文档

## 📋 概述

小程序API是专门为移动端小程序提供的接口服务，包含用户认证、客户搜索、签收单上传等核心功能。使用双token机制确保安全性。

## 🔐 认证机制

### 双Token认证
小程序API使用双token认证机制：
- **Access Token**：有效期2小时，用于日常API调用
- **Refresh Token**：有效期7天，用于刷新Access Token
- 无需复杂的签名验证，简化前端实现

### Token使用方式

在请求头中携带Access Token：

```javascript
// API调用示例
wx.request({
  url: '/api/miniprogram/customers/search',
  method: 'GET',
  header: {
    'Authorization': `Bearer ${accessToken}`
  },
  data: {
    customerNumber: 'C001'
  }
});
```

### Token刷新机制

当Access Token过期时，使用Refresh Token获取新的token对：

```javascript
// Token刷新示例
wx.request({
  url: '/api/miniprogram/refresh-token',
  method: 'POST',
  data: {
    refreshToken: refreshToken
  },
  success: (res) => {
    // 更新存储的token
    wx.setStorageSync('accessToken', res.data.accessToken);
    wx.setStorageSync('refreshToken', res.data.refreshToken);
  }
});
```

## 👤 用户认证接口

### 小程序用户登录（推荐）
**接口地址**: `POST /api/miniprogram/login`
**权限要求**: 无需认证
**功能描述**: 小程序用户通过手机号授权登录，返回双token

#### 请求参数
```json
{
  "code": "手机号授权code"
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200,
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "name": "张三",
      "phone": "138****0001",
      "role": "司机"
    }
  }
}
```

### Token刷新接口
**接口地址**: `POST /api/miniprogram/refresh-token`
**权限要求**: 无需认证
**功能描述**: 使用Refresh Token获取新的Access Token

#### 请求参数
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "Token刷新成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200,
    "tokenType": "Bearer"
  }
}
```

### 小程序用户登录（原始方式）
**接口地址**: `POST /api/wx-users/login`
**权限要求**: 无需认证
**功能描述**: 小程序用户通过微信openid和手机号进行登录

#### 请求参数
```json
{
  "wechatId": "wx_openid_123456",
  "phone": "13800000001",
  "macAddress": "AA:BB:CC:DD:EE:FF"
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "张三",
      "phone": "13800000001",
      "role": "driver",
      "wechatId": "wx_openid_123456"
    }
  }
}
```

### 微信授权手机号登录（推荐）
**接口地址**: `POST /api/wx-users/login-with-phone`
**权限要求**: 无需认证
**功能描述**: 通过微信授权获取手机号进行登录，自动创建或绑定用户账户

#### 请求参数
```json
{
  "code": "0c1234567890abcdef",
  "jsCode": "0a1234567890abcdef",
  "macAddress": "AA:BB:CC:DD:EE:FF"
}
```

#### 参数说明
- `code`: 手机号授权code（通过button open-type="getPhoneNumber"获取）
- `jsCode`: 微信登录code（通过wx.login()获取）
- `macAddress`: 设备MAC地址（可选，用于设备绑定）

#### 响应示例
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "张三",
      "phone": "13800138001",
      "role": "司机",
      "wechatId": "wx_openid_123456"
    }
  }
}
```

#### 错误响应
```json
{
  "code": 404,
  "message": "用户不存在，请联系管理员创建账户",
  "data": null
}
```

#### 流程说明
1. 小程序调用`wx.login()`获取jsCode
2. 用户点击授权按钮获取手机号code
3. 后端通过jsCode调用微信API获取openid
4. 后端通过code调用微信API获取手机号
5. 根据手机号查找用户并绑定微信信息
6. 生成JWT token返回给小程序
```

#### 错误响应
```json
{
  "code": 404,
  "message": "用户不存在，请联系管理员创建账户",
  "data": null
}
```

## 🔍 客户搜索接口

### 搜索客户信息
**接口地址**: `GET /api/miniprogram/customers/search`  
**权限要求**: 需要签名校验  
**功能描述**: 司机根据客户编号或名称搜索客户信息

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `keyword` | string | 否 | 搜索关键词（客户编号或名称） |
| `customerNumber` | string | 否 | 客户编号（精确匹配） |
| `wxUserId` | number | 是 | 小程序用户ID |
| `timestamp` | string | 是 | 时间戳 |
| `nonce` | string | 是 | 随机数 |
| `signature` | string | 是 | 签名值 |

#### 请求示例
```
GET /api/miniprogram/customers/search?keyword=深圳&wxUserId=1&timestamp=1704387123456&nonce=abc123def456&signature=a1b2c3d4e5f6...
```

#### 响应示例
```json
{
  "code": 200,
  "message": "搜索成功",
  "data": [
    {
      "id": 1,
      "customerNumber": "C001",
      "customerName": "深圳科技有限公司",
      "contactPerson": "张经理",
      "contactPhone": "13800138000",
      "storeAddress": "深圳市南山区科技园南区A座",
      "warehouseAddress": "深圳市南山区科技园南区B座",
      "longitude": 114.057868,
      "latitude": 22.543099
    }
  ]
}
```

### 获取客户详情
**接口地址**: `GET /api/miniprogram/customers/:customerNumber`  
**权限要求**: 需要签名校验  
**功能描述**: 根据客户编号获取客户详细信息

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `customerNumber` | string | 是 | 客户编号（路径参数） |
| `wxUserId` | number | 是 | 小程序用户ID |
| `timestamp` | string | 是 | 时间戳 |
| `nonce` | string | 是 | 随机数 |
| `signature` | string | 是 | 签名值 |

#### 响应示例
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "customerNumber": "C001",
    "customerName": "深圳科技有限公司",
    "contactPerson": "张经理",
    "contactPhone": "13800138000",
    "storeAddress": "深圳市南山区科技园南区A座",
    "warehouseAddress": "深圳市南山区科技园南区B座",
    "detailAddress": "深圳市南山区科技园南区A座1001室",
    "longitude": 114.057868,
    "latitude": 22.543099,
    "updateTime": "2025-01-09T10:30:00.000Z"
  }
}
```

## 📋 签收单接口

### 上传签收单
**接口地址**: `POST /api/miniprogram/receipts/upload`  
**权限要求**: 需要签名校验  
**功能描述**: 小程序用户上传签收单图片和相关信息  
**请求类型**: `multipart/form-data`

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `file` | File | 是 | 签收单图片文件 |
| `wxUserId` | number | 是 | 小程序用户ID |
| `wxUserName` | string | 是 | 上传人姓名 |
| `customerName` | string | 是 | 客户名称 |
| `customerId` | number | 否 | 客户ID |
| `customerAddress` | string | 否 | 客户地址 |
| `uploadLocation` | string | 否 | 上传地点 |
| `uploadLongitude` | number | 否 | 上传经度 |
| `uploadLatitude` | number | 否 | 上传纬度 |
| `timestamp` | string | 是 | 时间戳 |
| `nonce` | string | 是 | 随机数 |
| `signature` | string | 是 | 签名值 |

#### 请求示例
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('wxUserId', '1');
formData.append('wxUserName', '张三');
formData.append('customerName', '深圳科技有限公司');
formData.append('customerAddress', '深圳市南山区科技园');
formData.append('uploadLocation', '深圳市南山区...');
formData.append('uploadLongitude', '114.057868');
formData.append('uploadLatitude', '22.543099');
formData.append('timestamp', '1704387123456');
formData.append('nonce', 'abc123def456');
formData.append('signature', 'a1b2c3d4e5f6...');

fetch('/api/miniprogram/receipts/upload', {
  method: 'POST',
  body: formData
});
```

#### 响应示例
```json
{
  "code": 200,
  "message": "签收单上传成功",
  "data": {
    "id": 1,
    "imageUrl": "http://localhost:3000/receipts/uploads/2025/01/09/receipt_1704758400000.jpg",
    "uploadTime": "2025-01-09T10:30:00.000Z",
    "wxUserName": "张三",
    "customerName": "深圳科技有限公司"
  }
}
```

## 👥 客户管理接口（销售人员）

### 新增客户
**接口地址**: `POST /api/miniprogram/customers/create`  
**权限要求**: 需要签名校验，仅销售人员可用  
**功能描述**: 销售人员添加新客户信息

#### 请求参数
```json
{
  "wxUserId": 1,
  "operatorName": "李四",
  "customerNumber": "C003",
  "customerName": "北京贸易有限公司",
  "contactPerson": "王经理",
  "contactPhone": "13700137000",
  "storeAddress": "北京市朝阳区商业街100号",
  "warehouseAddress": "北京市通州区物流园区",
  "longitude": 116.407526,
  "latitude": 39.904030,
  "timestamp": "1704387123456",
  "nonce": "abc123def456",
  "signature": "a1b2c3d4e5f6..."
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "客户创建成功",
  "data": {
    "id": 3,
    "customerNumber": "C003",
    "customerName": "北京贸易有限公司",
    "contactPerson": "王经理",
    "contactPhone": "13700137000",
    "createTime": "2025-01-09T10:30:00.000Z"
  }
}
```

### 更新客户地址
**接口地址**: `PATCH /api/miniprogram/customers/update`  
**权限要求**: 需要签名校验  
**功能描述**: 更新客户的地址信息

#### 请求参数
```json
{
  "wxUserId": 1,
  "operatorName": "张三",
  "customerNumber": "C001",
  "storeAddress": "深圳市南山区科技园南区A座新地址",
  "warehouseAddress": "深圳市南山区科技园南区B座新地址",
  "timestamp": "1704387123456",
  "nonce": "abc123def456",
  "signature": "a1b2c3d4e5f6..."
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "客户信息更新成功",
  "data": {
    "customerNumber": "C001",
    "customerName": "深圳科技有限公司",
    "storeAddress": "深圳市南山区科技园南区A座新地址",
    "warehouseAddress": "深圳市南山区科技园南区B座新地址",
    "updateTime": "2025-01-09T10:30:00.000Z"
  }
}
```

## 🛠️ 开发工具接口

### 获取用户签名密钥（仅开发环境）
**接口地址**: `POST /api/miniprogram/dev/user-signature-key`  
**权限要求**: 仅开发环境可用  
**功能描述**: 获取指定用户的签名密钥，用于开发调试

#### 请求参数
```json
{
  "wxUserId": 1
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "wxUserId": 1,
    "secretKey": "user_signature_key_here",
    "warning": "此密钥仅用于开发测试，请勿在生产环境使用"
  }
}
```

## 📊 错误码说明

### 通用错误码
| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 200 | 请求成功 | - |
| 400 | 请求参数错误 | 检查请求参数格式和必填项 |
| 401 | 签名校验失败 | 检查签名算法和参数 |
| 403 | 权限不足 | 检查用户角色和权限 |
| 404 | 资源不存在 | 检查请求的资源是否存在 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 签名校验错误
| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| 缺少签名参数 | 缺少必需的签名参数 | 添加timestamp、nonce、signature参数 |
| 时间戳格式无效 | timestamp格式错误 | 使用正确的时间戳格式 |
| 请求已过期 | 请求时间超过5分钟 | 检查客户端时间同步 |
| nonce长度不能少于8位 | nonce太短 | 使用至少8位的随机字符串 |
| 请求重复，nonce已被使用 | 重放攻击检测 | 使用新的nonce值 |
| 签名验证失败 | 签名不匹配 | 检查签名算法和密钥 |

## 🔧 调试建议

### 1. 签名调试
- 使用开发环境的密钥获取接口获取正确的签名密钥
- 确保参数排序和拼接方式正确
- 验证HMAC-SHA256算法实现

### 2. 网络调试
- 使用浏览器开发者工具查看网络请求
- 检查请求头和请求体格式
- 确认服务器响应状态码

### 3. 时间同步
- 确保客户端时间与服务器时间同步
- 使用服务器时间接口校准本地时间
- 考虑网络延迟对时间戳的影响

---

**相关文档**: 
- [小程序接口安全](../03-安全认证/小程序接口安全.md) - 详细的安全机制说明
- [小程序功能](../04-功能模块/小程序功能.md) - 小程序端功能详解
