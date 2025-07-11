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

    // 生成请求追踪ID（用于日志关联）
    const traceId = this.generateTraceId();
    
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
    let message = '参数验证失败';
    let details = undefined;

    // 处理class-validator的错误格式
    if (Array.isArray(response.message)) {
      const validationErrors = response.message;
      const errorMessages: string[] = [];
      
      validationErrors.forEach((error: any) => {
        if (error.constraints) {
          Object.values(error.constraints).forEach((constraint: any) => {
            errorMessages.push(constraint);
          });
        }
      });
      
      if (errorMessages.length > 0) {
        message = errorMessages[0]; // 只显示第一个错误
        details = {
          field: validationErrors[0]?.property,
          errors: errorMessages,
        };
      }
    } else if (typeof response.message === 'string') {
      message = response.message;
    }

    return {
      httpStatus: HttpStatus.BAD_REQUEST,
      code: RESPONSE_CODES.PARAM_ERROR,
      message,
      details,
      isBusinessError: true,
    };
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
      code: RESPONSE_CODES.PARAM_ERROR,
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
    if (process.env.NODE_ENV === 'development') {
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
   */
  private mapHttpStatusToCode(status: number): number {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
      case HttpStatus.UNAUTHORIZED:
      case HttpStatus.FORBIDDEN:
      case HttpStatus.NOT_FOUND:
      case HttpStatus.CONFLICT:
        return RESPONSE_CODES.PARAM_ERROR;
      case HttpStatus.INTERNAL_SERVER_ERROR:
      case HttpStatus.BAD_GATEWAY:
      case HttpStatus.SERVICE_UNAVAILABLE:
        return RESPONSE_CODES.SERVER_ERROR;
      default:
        return status >= 500 ? RESPONSE_CODES.SERVER_ERROR : RESPONSE_CODES.PARAM_ERROR;
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
