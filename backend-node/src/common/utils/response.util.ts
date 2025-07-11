/**
 * 统一响应格式工具类
 */
export class ResponseUtil {
  /**
   * 成功响应
   */
  static success<T>(data?: T, message: string = '操作成功') {
    return {
      code: 200,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 分页响应 - 标准格式
   * 所有分页接口都应该使用这个格式，确保前端处理的一致性
   */
  static page<T>(data: T[], total: number, page: number, limit: number, message: string = '获取成功') {
    return {
      code: 200,
      message,
      data: {
        list: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 分页响应 - 兼容旧格式（已废弃，请使用 page 方法）
   * @deprecated 请使用 ResponseUtil.page() 方法
   */
  static pageOld<T>(data: T[], total: number, page: number, limit: number, message: string = '获取成功') {
    console.warn('⚠️ 使用了已废弃的 pageOld 方法，请改用 page 方法以确保分页格式统一');
    return {
      code: 200,
      message,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 失败响应
   */
  static error(message: string = '操作失败', code: number = 400) {
    return {
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
} 