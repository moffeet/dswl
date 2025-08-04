import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLogger } from '../../config/logger.config';
import { RESPONSE_CODES } from '../constants/response-codes';

/**
 * 全局异常过滤器
 * 统一处理所有未捕获的异常，提供一致的错误响应格式
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new CustomLogger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 使用请求中的追踪ID，如果没有则生成新的
    const traceId = (request as any).traceId || this.generateTraceId();

    // 解析异常信息
    const exceptionInfo = this.parseException(exception);

    // 记录异常日志
    this.logException(exception, request, traceId, exceptionInfo);

    // 构建响应数据
    const responseData = this.buildErrorResponse(exceptionInfo, request, traceId);

    // 返回统一格式的错误响应
    response.status(exceptionInfo.httpStatus).json(responseData);
  }

  /**
   * 解析异常信息
   */
  private parseException(exception: unknown): {
    httpStatus: number;
    code: number;
    message: string;
    details?: any;
    isBusinessError: boolean;
  } {
    // HTTP异常
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      
      // 处理验证错误
      if (status === HttpStatus.BAD_REQUEST && typeof response === 'object') {
        return this.handleValidationError(response as any);
      }
      
      // 处理其他HTTP异常
      return {
        httpStatus: status,
        code: this.mapHttpStatusToCode(status),
        message: typeof response === 'string' ? response : (response as any).message || '请求处理失败',
        details: typeof response === 'object' ? response : undefined,
        isBusinessError: status < 500,
      };
    }
    
    // 数据库错误
    if (this.isDatabaseError(exception)) {
      return this.handleDatabaseError(exception as any);
    }
    
    // 文件系统错误
    if (this.isFileSystemError(exception)) {
      return this.handleFileSystemError(exception as any);
    }
    
    // 未知错误
    return {
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      code: RESPONSE_CODES.SERVER_ERROR,
      message: '服务器内部错误',
      isBusinessError: false,
    };
  }

  /**
   * 处理验证错误
   */
  private handleValidationError(response: any): {
    httpStatus: number;
    code: number;
    message: string;
    details?: any;
    isBusinessError: boolean;
  } {
    console.log('🔍 [调试] 验证错误响应格式:', JSON.stringify(response, null, 2));

    let message = '参数验证失败';
    let details = undefined;

    // 处理class-validator的错误格式
    if (Array.isArray(response.message)) {
      console.log('🔍 [调试] 检测到数组格式的验证错误');
      const validationErrors = response.message;

      // 检查是否是简单的字符串数组（NestJS ValidationPipe的默认格式）
      if (validationErrors.length > 0 && typeof validationErrors[0] === 'string') {
        console.log('🔍 [调试] 简单字符串数组格式的验证错误');
        message = validationErrors[0]; // 使用第一个错误作为主要消息
        details = {
          errors: validationErrors,
          errorCount: validationErrors.length,
          allErrors: validationErrors.join('; ')
        };
      } else {
        // 处理复杂对象格式的验证错误
        const formattedErrors = this.formatValidationErrors(validationErrors);
        if (formattedErrors.length > 0) {
          message = formattedErrors[0].message;
          details = {
            field: formattedErrors[0].field,
            value: formattedErrors[0].value,
            errors: formattedErrors.map(err => err.message),
            validationRules: formattedErrors[0].rules,
          };
        }
      }
      console.log('🔍 [调试] 格式化后的验证错误详情:', JSON.stringify(details, null, 2));
    } else if (typeof response.message === 'string') {
      console.log('🔍 [调试] 检测到字符串格式的验证错误:', response.message);
      message = response.message;
    } else {
      console.log('🔍 [调试] 未知的验证错误格式');
    }

    return {
      httpStatus: HttpStatus.BAD_REQUEST,
      code: RESPONSE_CODES.BAD_REQUEST,
      message,
      details,
      isBusinessError: true,
    };
  }

  /**
   * 格式化验证错误信息
   */
  private formatValidationErrors(validationErrors: any[]): Array<{
    field: string;
    value: any;
    message: string;
    rules: string[];
  }> {
    const formattedErrors: Array<{
      field: string;
      value: any;
      message: string;
      rules: string[];
    }> = [];

    validationErrors.forEach((error: any) => {
      if (error.constraints) {
        const rules = Object.keys(error.constraints);
        const messages = Object.values(error.constraints) as string[];

        // 优先使用自定义错误消息，否则使用友好的默认消息
        const friendlyMessage = this.getFriendlyValidationMessage(error, rules, messages);

        formattedErrors.push({
          field: error.property,
          value: error.value,
          message: friendlyMessage,
          rules: rules,
        });
      }
    });

    return formattedErrors;
  }

  /**
   * 获取友好的验证错误消息
   */
  private getFriendlyValidationMessage(error: any, rules: string[], messages: string[]): string {
    const field = error.property;
    const value = error.value;

    // 如果有自定义消息且是中文，优先使用
    for (const message of messages) {
      if (message && this.isChineseMessage(message)) {
        return message;
      }
    }

    // 否则根据验证规则生成友好的中文消息
    for (const rule of rules) {
      const friendlyMessage = this.generateFriendlyMessage(field, value, rule);
      if (friendlyMessage) {
        return friendlyMessage;
      }
    }

    // 兜底消息
    return `${field}字段验证失败`;
  }

  /**
   * 判断是否为中文错误消息
   */
  private isChineseMessage(message: string): boolean {
    return /[\u4e00-\u9fa5]/.test(message);
  }

  /**
   * 根据验证规则生成友好的中文消息
   */
  private generateFriendlyMessage(field: string, value: any, rule: string): string {
    const fieldName = this.getFieldDisplayName(field);

    switch (rule) {
      case 'isNotEmpty':
        return `${fieldName}不能为空`;
      case 'isString':
        return `${fieldName}必须是字符串`;
      case 'isNumber':
        return `${fieldName}必须是数字`;
      case 'isEmail':
        return `${fieldName}格式不正确，请输入有效的邮箱地址`;
      case 'isPhoneNumber':
        return `${fieldName}格式不正确，请输入有效的手机号码`;
      case 'minLength':
        return `${fieldName}长度不能少于要求的最小长度`;
      case 'maxLength':
        return `${fieldName}长度不能超过要求的最大长度`;
      case 'length':
        return `${fieldName}长度不符合要求`;
      case 'min':
        return `${fieldName}不能小于最小值`;
      case 'max':
        return `${fieldName}不能大于最大值`;
      case 'isEnum':
        return `${fieldName}的值不在允许的选项范围内`;
      case 'isBoolean':
        return `${fieldName}必须是布尔值（true或false）`;
      case 'isArray':
        return `${fieldName}必须是数组`;
      case 'isObject':
        return `${fieldName}必须是对象`;
      case 'isUrl':
        return `${fieldName}必须是有效的URL地址`;
      case 'isUUID':
        return `${fieldName}必须是有效的UUID格式`;
      case 'isDateString':
        return `${fieldName}必须是有效的日期格式`;
      case 'isNumberString':
        return `${fieldName}必须是数字字符串`;
      case 'matches':
        return `${fieldName}格式不正确`;
      default:
        return `${fieldName}验证失败`;
    }
  }

  /**
   * 获取字段的显示名称
   */
  private getFieldDisplayName(field: string): string {
    const fieldNameMap: { [key: string]: string } = {
      'username': '用户名',
      'password': '密码',
      'email': '邮箱',
      'phone': '手机号',
      'name': '姓名',
      'nickname': '昵称',
      'title': '标题',
      'content': '内容',
      'description': '描述',
      'address': '地址',
      'customerName': '客户名称',
      'customerNumber': '客户编号',
      'storeAddress': '门店地址',
      'warehouseAddress': '仓库地址',
      'roleName': '角色名称',
      'roleCode': '角色编码',
      'wxUserId': '用户ID',
      'wechatId': '微信ID',
      'macAddress': 'MAC地址',
      'timestamp': '时间戳',
      'nonce': '随机数',
      'signature': '签名',
      'captchaId': '验证码ID',
      'captchaCode': '验证码',
      'customerId': '客户ID',
      'imageUrl': '图片地址',
      'uploadTime': '上传时间',
      'role': '角色',
      'status': '状态',
      'id': 'ID',
      'createTime': '创建时间',
      'updateTime': '更新时间',
    };

    return fieldNameMap[field] || field;
  }

  /**
   * 处理数据库错误
   */
  private handleDatabaseError(error: any): {
    httpStatus: number;
    code: number;
    message: string;
    isBusinessError: boolean;
  } {
    // MySQL错误码映射
    const mysqlErrorMap: { [key: string]: string } = {
      'ER_DUP_ENTRY': '数据已存在，不能重复添加',
      'ER_NO_REFERENCED_ROW_2': '关联的数据不存在',
      'ER_ROW_IS_REFERENCED_2': '数据正在被使用，无法删除',
      'ER_DATA_TOO_LONG': '数据长度超出限制',
      'ER_BAD_NULL_ERROR': '必填字段不能为空',
    };

    const errorCode = error.code || error.errno;
    const message = mysqlErrorMap[errorCode] || '数据库操作失败';

    return {
      httpStatus: HttpStatus.BAD_REQUEST,
      code: RESPONSE_CODES.BAD_REQUEST,
      message,
      isBusinessError: true,
    };
  }

  /**
   * 处理文件系统错误
   */
  private handleFileSystemError(error: any): {
    httpStatus: number;
    code: number;
    message: string;
    isBusinessError: boolean;
  } {
    const fileErrorMap: { [key: string]: string } = {
      'ENOENT': '文件或目录不存在',
      'EACCES': '文件访问权限不足',
      'ENOSPC': '磁盘空间不足',
      'EMFILE': '打开文件数量超出限制',
    };

    const errorCode = error.code;
    const message = fileErrorMap[errorCode] || '文件操作失败';

    return {
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      code: RESPONSE_CODES.SERVER_ERROR,
      message,
      isBusinessError: false,
    };
  }

  /**
   * 记录异常日志
   */
  private logException(
    exception: unknown,
    request: Request,
    traceId: string,
    exceptionInfo: any,
  ): void {
    const logData = {
      traceId,
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: this.getClientIp(request),
      userId: (request as any).user?.id,
      timestamp: new Date().toISOString(),
    };

    const logMessage = `异常捕获 [${traceId}] ${request.method} ${request.url} - ${exceptionInfo.message}`;

    if (exceptionInfo.isBusinessError) {
      // 业务异常记录为警告级别
      this.logger.warn(`${logMessage} | ${JSON.stringify(logData)}`);
    } else {
      // 系统异常记录为错误级别，包含堆栈信息
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`${logMessage} | ${JSON.stringify(logData)}`, stack);
    }
  }

  /**
   * 构建错误响应
   */
  private buildErrorResponse(
    exceptionInfo: any,
    request: Request,
    traceId: string,
  ): any {
    const baseResponse = {
      code: exceptionInfo.code,
      message: exceptionInfo.message,
      data: null,
      timestamp: new Date().toISOString(),
    };

    // 开发环境返回更多调试信息
    // 使用更宽松的环境判断，确保开发环境能显示详细信息
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      console.log(`🔍 [调试] 环境: ${process.env.NODE_ENV}, 返回详细错误信息`);
      return {
        ...baseResponse,
        traceId,
        path: request.url,
        method: request.method,
        details: exceptionInfo.details,
      };
    }

    // 生产环境只返回基本信息
    return baseResponse;
  }

  /**
   * 生成请求追踪ID
   */
  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取客户端IP
   */
  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const xRealIp = request.headers['x-real-ip'];

    return (
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0] ||
      (Array.isArray(xRealIp) ? xRealIp[0] : xRealIp) ||
      request.connection?.remoteAddress ||
      (request.socket as any)?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * 映射HTTP状态码到业务响应码
   * 让HTTP状态码和响应体code保持一致，方便前端处理
   */
  private mapHttpStatusToCode(status: number): number {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return RESPONSE_CODES.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return RESPONSE_CODES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return RESPONSE_CODES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return RESPONSE_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return RESPONSE_CODES.BAD_REQUEST; // 冲突归类为请求错误
      case HttpStatus.INTERNAL_SERVER_ERROR:
      case HttpStatus.BAD_GATEWAY:
      case HttpStatus.SERVICE_UNAVAILABLE:
        return RESPONSE_CODES.SERVER_ERROR;
      default:
        // 5xx错误归类为服务器错误，4xx错误归类为请求错误
        return status >= 500 ? RESPONSE_CODES.SERVER_ERROR : RESPONSE_CODES.BAD_REQUEST;
    }
  }

  /**
   * 判断是否为数据库错误
   */
  private isDatabaseError(exception: unknown): boolean {
    if (!exception || typeof exception !== 'object') return false;
    
    const error = exception as any;
    return (
      error.code?.startsWith('ER_') || // MySQL错误
      error.name === 'QueryFailedError' || // TypeORM错误
      error.name === 'DatabaseError' ||
      error.message?.includes('database') ||
      error.message?.includes('SQL')
    );
  }

  /**
   * 判断是否为文件系统错误
   */
  private isFileSystemError(exception: unknown): boolean {
    if (!exception || typeof exception !== 'object') return false;
    
    const error = exception as any;
    const fileErrorCodes = ['ENOENT', 'EACCES', 'ENOSPC', 'EMFILE', 'ENOTDIR'];
    return fileErrorCodes.includes(error.code);
  }
}
