/**
 * 统一响应码常量
 */
export const RESPONSE_CODES = {
  SUCCESS: 200,           // 成功
  PARAM_ERROR: 403,       // 参数错误/权限错误
  SERVER_ERROR: 500,      // 服务器错误
  USER_NOT_FOUND: 1001,   // 用户不存在
} as const;

/**
 * HTTP状态码常量
 * 用于@ApiResponse装饰器和HTTP响应
 */
export const HTTP_STATUS_CODES = {
  // 2xx 成功状态码
  OK: 200,                    // 请求成功（统一使用200表示所有成功情况）

  // 4xx 客户端错误状态码
  BAD_REQUEST: 400,           // 请求参数错误
  UNAUTHORIZED: 401,          // 未授权
  FORBIDDEN: 403,             // 禁止访问
  NOT_FOUND: 404,             // 资源不存在
  METHOD_NOT_ALLOWED: 405,    // 方法不允许
  CONFLICT: 409,              // 冲突（如数据已存在）
  UNPROCESSABLE_ENTITY: 422,  // 无法处理的实体

  // 5xx 服务器错误状态码
  INTERNAL_SERVER_ERROR: 500, // 服务器内部错误
  BAD_GATEWAY: 502,           // 网关错误
  SERVICE_UNAVAILABLE: 503,   // 服务不可用
  GATEWAY_TIMEOUT: 504,       // 网关超时
} as const;

/**
 * 响应消息常量
 */
export const RESPONSE_MESSAGES = {
  SUCCESS: '操作成功',
  PARAM_ERROR: '参数错误',
  SERVER_ERROR: '服务器内部错误',
  
  // 具体操作消息
  GET_SUCCESS: '获取成功',
  CREATE_SUCCESS: '创建成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  SEARCH_SUCCESS: '搜索成功',
  EXPORT_SUCCESS: '导出成功',
  SYNC_SUCCESS: '同步成功',
  
  // 错误消息
  NOT_FOUND: '数据不存在',
  ALREADY_EXISTS: '数据已存在',
  PERMISSION_DENIED: '权限不足',
  INVALID_PARAMS: '参数无效',
  USER_NOT_FOUND: '用户不存在，请联系管理员创建账户',
} as const;
