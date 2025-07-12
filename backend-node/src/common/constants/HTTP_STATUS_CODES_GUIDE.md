# HTTP状态码统一使用指南

## 📋 概述

为了统一项目中HTTP状态码的使用，避免硬编码，我们定义了统一的状态码常量。

## 🎯 使用原则

1. **禁止硬编码状态码** - 所有地方都应使用常量
2. **区分HTTP状态码和业务响应码** - HTTP状态码用于@ApiResponse，业务响应码用于返回数据
3. **保持一致性** - 相同场景使用相同的状态码

## 📚 常量定义

### HTTP状态码常量 (HTTP_STATUS_CODES)

```typescript
// 成功状态码
HTTP_STATUS_CODES.OK = 200                    // 请求成功
HTTP_STATUS_CODES.CREATED = 201               // 创建成功
HTTP_STATUS_CODES.NO_CONTENT = 204            // 无内容

// 客户端错误状态码
HTTP_STATUS_CODES.BAD_REQUEST = 400           // 请求参数错误
HTTP_STATUS_CODES.UNAUTHORIZED = 401          // 未授权
HTTP_STATUS_CODES.FORBIDDEN = 403             // 禁止访问
HTTP_STATUS_CODES.NOT_FOUND = 404             // 资源不存在
HTTP_STATUS_CODES.CONFLICT = 409              // 冲突（如数据已存在）

// 服务器错误状态码
HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR = 500 // 服务器内部错误
```

### 业务响应码常量 (RESPONSE_CODES)

```typescript
RESPONSE_CODES.SUCCESS = 200           // 成功
RESPONSE_CODES.PARAM_ERROR = 403       // 参数错误/权限错误
RESPONSE_CODES.SERVER_ERROR = 500      // 服务器错误
```

## 🔧 使用方法

### 1. 在Controller中使用

```typescript
import { HTTP_STATUS_CODES, RESPONSE_CODES } from '../common/constants/response-codes';

@Controller('users')
export class UsersController {
  
  // ✅ 正确：使用常量
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '获取成功' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  async findOne(@Param('id') id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      return {
        code: HTTP_STATUS_CODES.NOT_FOUND,
        message: '用户不存在',
        data: null
      };
    }
    
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: user
    };
  }
  
  // ❌ 错误：硬编码状态码
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
}
```

### 2. 使用工具类简化代码

```typescript
import { ApiResponseUtil, HttpStatusUtil } from '../common/utils/api-response.util';

@Controller('users')
export class UsersController {
  
  @ApiResponse({ status: HttpStatusUtil.SUCCESS.OK, description: '获取成功' })
  @ApiResponse({ status: HttpStatusUtil.ERROR.NOT_FOUND, description: '用户不存在' })
  async findOne(@Param('id') id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      return ApiResponseUtil.notFound('用户不存在');
    }
    
    return ApiResponseUtil.success(user, '获取成功');
  }
}
```

## 📖 常见场景映射

| 场景 | HTTP状态码 | 业务响应码 | 说明 |
|------|-----------|-----------|------|
| 获取数据成功 | 200 | 200 | 正常获取 |
| 创建数据成功 | 200 | 200 | 创建操作（统一使用200） |
| 更新数据成功 | 200 | 200 | 更新操作 |
| 删除数据成功 | 200 | 200 | 删除操作 |
| 参数验证失败 | 400 | 403 | 请求参数错误 |
| 未登录/token无效 | 401 | 403 | 认证失败 |
| 权限不足 | 403 | 403 | 授权失败 |
| 资源不存在 | 404 | 404 | 数据不存在 |
| 数据冲突 | 409 | 409 | 如手机号已存在 |
| 服务器错误 | 500 | 500 | 系统异常 |

## ✅ 最佳实践

1. **导入常量**
   ```typescript
   import { HTTP_STATUS_CODES, RESPONSE_CODES } from '../common/constants/response-codes';
   ```

2. **@ApiResponse装饰器使用HTTP状态码**
   ```typescript
   @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '成功' })
   @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '参数错误' })
   ```

3. **返回数据使用业务响应码**
   ```typescript
   return {
     code: RESPONSE_CODES.SUCCESS,
     message: '操作成功',
     data: result
   };
   ```

4. **使用工具类简化代码**
   ```typescript
   return ApiResponseUtil.success(data, '获取成功');
   return ApiResponseUtil.notFound('数据不存在');
   return ApiResponseUtil.badRequest('参数错误');
   ```

## 🚫 避免的做法

1. **硬编码状态码**
   ```typescript
   // ❌ 错误
   @ApiResponse({ status: 200, description: '成功' })
   return { code: 404, message: '不存在' };
   ```

2. **混用HTTP状态码和业务响应码**
   ```typescript
   // ❌ 错误：在业务响应中使用201
   return { code: 201, message: '创建成功' };
   ```

3. **不一致的状态码使用**
   ```typescript
   // ❌ 错误：同样的场景使用不同状态码
   // 文件A
   @ApiResponse({ status: 400, description: '参数错误' })
   // 文件B  
   @ApiResponse({ status: 422, description: '参数错误' })
   ```

## 🔄 迁移指南

如果现有代码中有硬编码状态码，按以下步骤迁移：

1. 导入常量
2. 替换@ApiResponse中的硬编码状态码
3. 替换返回数据中的硬编码状态码
4. 测试确保功能正常

通过统一使用状态码常量，可以提高代码的可维护性和一致性。
