# 🕐 时间格式化功能使用指南

## 📋 概述

本系统提供了完整的时间格式化解决方案，支持将返回给前端的时间字段（如 `updatedAt`）格式化为中文友好的格式。

## 🎯 功能特性

### ✅ 支持的时间格式

1. **中文格式**：`2025-07-11 12:11:01`
2. **相对时间**：`刚刚`、`5分钟前`、`2小时前`、`3天前`
3. **ISO格式**：`2025-07-11T04:11:01.000Z`（保持原格式）
4. **自定义格式**：支持自定义时间格式模板

### ✅ 多种使用方式

1. **装饰器方式**（推荐）
2. **请求参数方式**
3. **请求头方式**
4. **ResponseUtil 工具方法**
5. **直接使用工具类**

## 🚀 快速开始

### 1. 启用时间格式化拦截器

在 `app.module.ts` 中添加全局拦截器：

```typescript
import { TimeFormatInterceptor } from './common/interceptors/time-format.interceptor';

@Module({
  // ...
  providers: [
    // 添加时间格式化拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeFormatInterceptor,
    },
    // ...其他拦截器
  ],
})
export class AppModule {}
```

### 2. 在控制器中使用装饰器

```typescript
import { ChineseTime, RelativeTime, FormatTime } from './common/decorators/format-time.decorator';

@Controller('customers')
export class CustomersController {
  
  @Get()
  @ChineseTime() // 自动格式化时间为中文格式
  async findAll() {
    // 返回的 updatedAt 字段会自动格式化为：2025-07-11 12:11:01
    return ResponseUtil.success(customers, '获取成功');
  }

  @Get('recent')
  @RelativeTime() // 格式化为相对时间
  async getRecent() {
    // 返回的时间会格式化为：刚刚、5分钟前等
    return ResponseUtil.success(recentData, '获取成功');
  }
}
```

## 📖 详细使用方法

### 方法1：装饰器方式（推荐）

```typescript
// 中文时间格式
@ChineseTime()
async getCustomers() {
  // updatedAt: "2025-07-11 12:11:01"
}

// 相对时间格式
@RelativeTime()
async getRecentData() {
  // updatedAt: "5分钟前"
}

// 自定义格式
@FormatTime('chinese')
async getData() {
  // 支持：'chinese' | 'relative' | 'iso'
}
```

### 方法2：请求参数方式

```bash
# 启用中文时间格式
GET /api/customers?formatTime=true&timeFormat=chinese

# 启用相对时间格式
GET /api/customers?formatTime=true&timeFormat=relative

# 保持ISO格式
GET /api/customers?formatTime=true&timeFormat=iso
```

### 方法3：请求头方式

```bash
curl -H "X-Format-Time: true" \
     -H "X-Time-Format: chinese" \
     http://localhost:3000/api/customers
```

### 方法4：使用 ResponseUtil 工具方法

```typescript
// 成功响应 + 时间格式化
return ResponseUtil.successWithTimeFormat(data, '获取成功', true);

// 分页响应 + 时间格式化
return ResponseUtil.pageWithTimeFormat(
  customers, 
  total, 
  page, 
  limit, 
  '获取成功', 
  true
);
```

### 方法5：直接使用 DateFormatUtil 工具类

```typescript
import { DateFormatUtil } from './common/utils/date-format.util';

// 格式化为中文日期时间
const formatted = DateFormatUtil.formatDateTime(new Date());
// 结果：2025-07-11 12:11:01

// 格式化为相对时间
const relative = DateFormatUtil.formatRelativeTime(pastDate);
// 结果：5分钟前

// 自定义格式
const custom = DateFormatUtil.formatCustom(new Date(), 'YYYY年MM月DD日 HH:mm');
// 结果：2025年07月11日 12:11
```

## 🎨 格式化效果对比

### 原始格式（ISO）
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "customerName": "深圳科技有限公司",
    "updatedAt": "2025-07-11T04:11:01.000Z"
  },
  "timestamp": "2025-07-11T04:11:01.000Z"
}
```

### 中文格式化后
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "customerName": "深圳科技有限公司",
    "updatedAt": "2025-07-11 12:11:01"
  },
  "timestamp": "2025-07-11 12:11:01"
}
```

### 相对时间格式化后
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "customerName": "深圳科技有限公司",
    "updatedAt": "5分钟前"
  },
  "timestamp": "刚刚"
}
```

## 🔧 支持的时间字段

系统会自动识别并格式化以下时间字段：

- `createdAt` - 创建时间
- `updatedAt` - 更新时间
- `createTime` - 创建时间
- `updateTime` - 更新时间
- `uploadTime` - 上传时间
- `lastSyncTime` - 最后同步时间
- `timestamp` - 时间戳

## 📝 实际应用示例

### 客户管理接口

```typescript
@Controller('customers')
export class CustomersController {
  
  @Get()
  @ChineseTime() // 使用中文时间格式
  @ApiOperation({ summary: '获取客户列表' })
  async findAll(@Query() query: SearchCustomerDto) {
    const result = await this.customersService.findAll(query);
    
    // 返回的 updatedAt 会自动格式化为：2025-07-11 12:11:01
    return ResponseUtil.page(
      result.data,
      result.total,
      result.page,
      result.limit,
      '获取成功'
    );
  }

  @Get(':id')
  @RelativeTime() // 使用相对时间格式
  async findOne(@Param('id') id: number) {
    const customer = await this.customersService.findOne(id);
    
    // updatedAt 会显示为：刚刚、5分钟前、2小时前等
    return ResponseUtil.success(customer, '获取成功');
  }
}
```

## 🎯 最佳实践

### 1. 推荐使用装饰器方式
- 代码简洁，易于维护
- 类型安全，编译时检查
- 统一的代码风格

### 2. 根据业务场景选择格式
- **列表页面**：使用相对时间（@RelativeTime）
- **详情页面**：使用中文格式（@ChineseTime）
- **日志记录**：保持ISO格式

### 3. 前端适配建议
```javascript
// 前端可以通过请求参数控制时间格式
const fetchCustomers = (formatTime = true) => {
  return axios.get('/api/customers', {
    params: { 
      formatTime,
      timeFormat: 'chinese' // 或 'relative'
    }
  });
};
```

## 🔍 测试验证

### 1. 启动服务
```bash
cd backend-node && npm run start:dev
```

### 2. 测试不同格式
```bash
# 测试中文格式
curl "http://localhost:3000/api/customers?formatTime=true&timeFormat=chinese"

# 测试相对时间
curl "http://localhost:3000/api/customers?formatTime=true&timeFormat=relative"

# 测试原始格式
curl "http://localhost:3000/api/customers"
```

## 📚 相关文件

- `src/common/utils/date-format.util.ts` - 时间格式化工具类
- `src/common/decorators/format-time.decorator.ts` - 时间格式化装饰器
- `src/common/interceptors/time-format.interceptor.ts` - 时间格式化拦截器
- `src/common/utils/response.util.ts` - 响应工具类（已扩展）
- `src/common/examples/time-format-usage.example.ts` - 使用示例

---

**🎊 时间格式化功能已完成！现在您可以轻松地将返回给前端的时间格式化为用户友好的中文格式。**
