import { DateFormatUtil } from './date-format.util';

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
      timestamp: DateFormatUtil.formatDateTime(new Date()),
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
      timestamp: DateFormatUtil.formatDateTime(new Date()),
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
      timestamp: DateFormatUtil.formatDateTime(new Date()),
    };
  }

  /**
   * 成功响应 - 支持时间格式化
   * @param data 响应数据
   * @param message 响应消息
   * @param formatTime 是否格式化时间字段为中文格式
   */
  static successWithTimeFormat<T>(data?: T, message: string = '操作成功', formatTime: boolean = false) {
    const formattedData = formatTime ? this.formatTimeFields(data) : data;

    return {
      code: 200,
      message,
      data: formattedData,
      timestamp: formatTime ? DateFormatUtil.formatDateTime(new Date()) : new Date().toISOString(),
    };
  }

  /**
   * 分页响应 - 支持时间格式化
   * @param data 数据列表
   * @param total 总数
   * @param page 当前页
   * @param limit 每页数量
   * @param message 响应消息
   * @param formatTime 是否格式化时间字段为中文格式
   */
  static pageWithTimeFormat<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = '获取成功',
    formatTime: boolean = false
  ) {
    const formattedData = formatTime ? data.map(item => this.formatTimeFields(item)) : data;

    return {
      code: 200,
      message,
      data: {
        list: formattedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: formatTime ? DateFormatUtil.formatDateTime(new Date()) : new Date().toISOString(),
    };
  }

  /**
   * 格式化对象中的时间字段
   * @param obj 要格式化的对象
   * @returns 格式化后的对象
   */
  private static formatTimeFields(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.formatTimeFields(item));
    }

    const formatted = { ...obj };

    // 常见的时间字段名
    const timeFields = [
      'createdAt', 'updatedAt', 'createTime', 'updateTime',
      'uploadTime', 'lastSyncTime', 'timestamp'
    ];

    timeFields.forEach(field => {
      if (formatted[field]) {
        formatted[field] = DateFormatUtil.formatDateTime(formatted[field]);
      }
    });

    return formatted;
  }
}