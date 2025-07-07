/**
 * 统一响应码常量
 */
export const RESPONSE_CODES = {
  SUCCESS: 200,           // 成功
  PARAM_ERROR: 403,       // 参数错误/权限错误
  SERVER_ERROR: 500,      // 服务器错误
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
} as const;
