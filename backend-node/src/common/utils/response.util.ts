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
   * 分页响应
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