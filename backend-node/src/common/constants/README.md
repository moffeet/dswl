# 统一响应码规范

## 响应码定义

| 响应码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | 所有成功的操作 |
| 403 | 参数错误/权限错误 | 参数验证失败、权限不足、数据不存在等 |
| 500 | 服务器错误 | 系统内部错误、数据库错误等 |

## 使用方式

```typescript
import { RESPONSE_CODES, RESPONSE_MESSAGES } from '../common/constants/response-codes';

// 成功响应
return {
  code: RESPONSE_CODES.SUCCESS,
  message: RESPONSE_MESSAGES.GET_SUCCESS,
  data: result
};

// 参数错误响应
return {
  code: RESPONSE_CODES.PARAM_ERROR,
  message: RESPONSE_MESSAGES.INVALID_PARAMS,
  data: null
};

// 服务器错误响应
return {
  code: RESPONSE_CODES.SERVER_ERROR,
  message: RESPONSE_MESSAGES.SERVER_ERROR,
  data: null,
  error: error.message
};
```

## 已统一的模块

- ✅ customers.controller.ts - 客户管理
- ✅ users.controller.ts - 用户管理  
- ✅ roles.controller.ts - 角色管理
- ✅ permissions.controller.ts - 权限管理
- ✅ auth.controller.ts - 认证管理

## 注意事项

1. 所有成功操作统一使用 200 响应码
2. 404 错误已统一改为 403（参数错误）
3. 所有 controller 都已导入并使用统一的响应码常量
4. API 文档中的 example 值也已同步更新
