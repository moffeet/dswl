import { HTTP_STATUS_CODES, RESPONSE_CODES, RESPONSE_MESSAGES } from '../constants/response-codes';

/**
 * API响应工具类
 * 统一管理HTTP状态码和业务响应码
 */
export class ApiResponseUtil {
  
  /**
   * 成功响应
   */
  static success<T>(data: T, message: string = RESPONSE_MESSAGES.SUCCESS) {
    return {
      code: RESPONSE_CODES.SUCCESS,
      message,
      data
    };
  }

  /**
   * 分页响应
   */
  static page<T>(
    list: T[],
    total: number,
    page: number,
    limit: number,
    message: string = RESPONSE_MESSAGES.GET_SUCCESS
  ) {
    return {
      code: RESPONSE_CODES.SUCCESS,
      message,
      data: {
        list,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 错误响应
   */
  static error(
    code: number = RESPONSE_CODES.SERVER_ERROR,
    message: string = RESPONSE_MESSAGES.SERVER_ERROR,
    data: any = null
  ) {
    return {
      code,
      message,
      data
    };
  }

  /**
   * 参数错误响应
   */
  static paramError(message: string = RESPONSE_MESSAGES.PARAM_ERROR) {
    return {
      code: RESPONSE_CODES.BAD_REQUEST,
      message,
      data: null
    };
  }

  /**
   * 服务器错误响应
   */
  static serverError(message: string = RESPONSE_MESSAGES.SERVER_ERROR) {
    return {
      code: RESPONSE_CODES.SERVER_ERROR,
      message,
      data: null
    };
  }

  /**
   * 资源不存在响应
   */
  static notFound(message: string = RESPONSE_MESSAGES.NOT_FOUND) {
    return {
      code: HTTP_STATUS_CODES.NOT_FOUND,
      message,
      data: null
    };
  }

  /**
   * 未授权响应
   */
  static unauthorized(message: string = '未授权访问') {
    return {
      code: HTTP_STATUS_CODES.UNAUTHORIZED,
      message,
      data: null
    };
  }

  /**
   * 冲突响应（如数据已存在）
   */
  static conflict(message: string = RESPONSE_MESSAGES.ALREADY_EXISTS) {
    return {
      code: HTTP_STATUS_CODES.CONFLICT,
      message,
      data: null
    };
  }

  /**
   * 请求参数错误响应
   */
  static badRequest(message: string = '请求参数错误') {
    return {
      code: HTTP_STATUS_CODES.BAD_REQUEST,
      message,
      data: null
    };
  }
}

/**
 * HTTP状态码映射工具
 * 用于@ApiResponse装饰器
 */
export class HttpStatusUtil {
  
  /**
   * 获取常用的成功状态码
   */
  static get SUCCESS() {
    return {
      OK: HTTP_STATUS_CODES.OK
    };
  }

  /**
   * 获取常用的错误状态码
   */
  static get ERROR() {
    return {
      BAD_REQUEST: HTTP_STATUS_CODES.BAD_REQUEST,
      UNAUTHORIZED: HTTP_STATUS_CODES.UNAUTHORIZED,
      FORBIDDEN: HTTP_STATUS_CODES.FORBIDDEN,
      NOT_FOUND: HTTP_STATUS_CODES.NOT_FOUND,
      CONFLICT: HTTP_STATUS_CODES.CONFLICT,
      INTERNAL_SERVER_ERROR: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR
    };
  }

  /**
   * 获取所有状态码
   */
  static get ALL() {
    return HTTP_STATUS_CODES;
  }
}
