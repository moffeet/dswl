# 全局异常过滤器

## 📋 功能概述

全局异常过滤器 (`GlobalExceptionFilter`) 是系统的统一异常处理机制，负责捕获所有未被明确处理的异常，并返回统一格式的错误响应。

## 🎯 主要功能

### 1. 统一异常处理
- 捕获所有类型的异常（HTTP异常、数据库异常、文件系统异常等）
- 提供统一的错误响应格式
- 自动映射异常类型到业务响应码

### 2. 智能异常分类
- **HTTP异常**: 处理NestJS的HttpException及其子类
- **验证异常**: 特殊处理class-validator的验证错误
- **数据库异常**: 识别并友好化MySQL/TypeORM错误
- **文件系统异常**: 处理文件操作相关错误
- **未知异常**: 兜底处理所有其他异常

### 3. 详细日志记录
- 生成唯一的请求追踪ID
- 记录请求上下文信息（IP、User-Agent、用户ID等）
- 区分业务异常和系统异常的日志级别
- 系统异常包含完整堆栈信息

### 4. 环境适配
- 开发环境返回详细调试信息
- 生产环境只返回必要信息，保护系统安全

## 📊 响应格式

### 统一响应结构
```json
{
  "code": 403,
  "message": "参数验证失败",
  "data": null,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 开发环境额外信息
```json
{
  "code": 403,
  "message": "参数验证失败",
  "data": null,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "traceId": "1705312200000-abc123def",
  "path": "/api/users",
  "method": "POST",
  "details": {
    "field": "username",
    "errors": ["用户名不能为空"]
  }
}
```

## 🔧 异常类型处理

### 1. 验证异常 (class-validator)
```typescript
// 输入: { name: "" }
// 输出:
{
  "code": 403,
  "message": "名称不能为空",
  "data": null,
  "details": {
    "field": "name",
    "errors": ["名称不能为空"]
  }
}
```

### 2. 数据库异常
```typescript
// MySQL重复键错误
{
  "code": 403,
  "message": "数据已存在，不能重复添加",
  "data": null
}
```

### 3. 文件系统异常
```typescript
// 文件不存在错误
{
  "code": 500,
  "message": "文件或目录不存在",
  "data": null
}
```

## 🚀 使用方式

### 1. 自动处理
全局异常过滤器已在 `main.ts` 中注册，会自动捕获所有未处理的异常：

```typescript
// main.ts
app.useGlobalFilters(new GlobalExceptionFilter());
```

### 2. 手动抛出异常
在业务代码中可以直接抛出异常，过滤器会自动处理：

```typescript
// 业务异常
throw new BadRequestException('用户名已存在');

// 参数异常
throw new NotFoundException('用户不存在');

// 服务器异常
throw new InternalServerErrorException('系统繁忙，请稍后重试');
```

### 3. 验证异常
使用class-validator装饰器，验证失败会自动被过滤器处理：

```typescript
class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  username: string;
}
```

## 🧪 测试接口

开发环境下提供了测试接口来验证异常处理：

- `GET /api/test-exception/success` - 测试正常响应
- `POST /api/test-exception/validation-error` - 测试验证异常
- `GET /api/test-exception/business-error` - 测试业务异常
- `GET /api/test-exception/not-found-error` - 测试404异常
- `GET /api/test-exception/server-error` - 测试服务器异常
- `GET /api/test-exception/uncaught-error` - 测试未捕获异常
- `GET /api/test-exception/database-error` - 测试数据库异常
- `GET /api/test-exception/filesystem-error` - 测试文件系统异常

## 📝 日志格式

### 业务异常日志 (WARN级别)
```
2024-01-15 10:30:00.000 [WARN] [GlobalExceptionFilter] 异常捕获 [1705312200000-abc123def] POST /api/users - 用户名已存在 | {"traceId":"1705312200000-abc123def","method":"POST","url":"/api/users","userAgent":"Mozilla/5.0...","ip":"127.0.0.1","userId":1,"timestamp":"2024-01-15T10:30:00.000Z"}
```

### 系统异常日志 (ERROR级别)
```
2024-01-15 10:30:00.000 [ERROR] [GlobalExceptionFilter] 异常捕获 [1705312200000-abc123def] GET /api/test - 服务器内部错误 | {"traceId":"1705312200000-abc123def","method":"GET","url":"/api/test","userAgent":"Mozilla/5.0...","ip":"127.0.0.1","userId":null,"timestamp":"2024-01-15T10:30:00.000Z"}
Error: 测试异常
    at TestController.test (/path/to/file.js:10:11)
    ...
```

## ⚠️ 注意事项

1. **异常过滤器顺序**: 全局异常过滤器必须在ValidationPipe之前注册
2. **敏感信息**: 生产环境不会返回详细的错误信息和堆栈跟踪
3. **测试控制器**: 测试控制器仅在开发环境可用，生产环境会自动排除
4. **日志存储**: 异常日志会同时输出到控制台和文件，便于问题排查

## 🔄 扩展说明

如需添加新的异常类型处理，可以在 `parseException` 方法中添加相应的判断逻辑：

```typescript
// 添加新的异常类型处理
if (this.isCustomError(exception)) {
  return this.handleCustomError(exception as any);
}
```
