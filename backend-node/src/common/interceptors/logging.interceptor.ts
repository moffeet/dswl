import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CustomLogger } from '../../config/logger.config';

/**
 * 日志拦截器
 * 自动记录HTTP请求和响应的详细信息
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new CustomLogger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const { method, url, headers, body, query, params } = request;
    const traceId = request.traceId;
    const userAgent = headers['user-agent'] || '';
    const ip = this.getClientIp(request);
    const startTime = Date.now();

    // 记录请求开始日志
    this.logger.log(
      `请求开始 ${method} ${url}`,
      'HTTP',
      traceId
    );

    // 记录详细的请求信息（调试级别）
    this.logger.debug(
      `请求详情`,
      'HTTP',
      traceId
    );

    return next.handle().pipe(
      tap((data) => {
        // 请求成功完成
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        this.logger.log(
          `请求完成 ${method} ${url} - ${statusCode} - ${duration}ms`,
          'HTTP',
          traceId
        );

        // 记录响应详情（仅在调试模式）
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug(
            `响应详情 - 状态码: ${statusCode}, 耗时: ${duration}ms`,
            'HTTP',
            traceId
          );
        }
      }),
      catchError((error) => {
        // 请求处理出错
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;
        
        this.logger.error(
          `请求失败 ${method} ${url} - ${statusCode} - ${duration}ms - ${error.message}`,
          error.stack,
          'HTTP',
          traceId
        );

        // 重新抛出错误，让全局异常过滤器处理
        throw error;
      })
    );
  }

  /**
   * 获取客户端真实IP地址
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;

    return (
      forwardedIp?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      (request.connection as any)?.remoteAddress ||
      (request.socket as any)?.remoteAddress ||
      'unknown'
    );
  }
}
