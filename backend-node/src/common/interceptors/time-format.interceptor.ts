import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateFormatUtil } from '../utils/date-format.util';
import { FORMAT_TIME_KEY } from '../decorators/format-time.decorator';

/**
 * 时间格式化拦截器
 * 支持多种方式触发时间格式化：
 * 1. 使用 @FormatTime 装饰器
 * 2. 请求参数 formatTime=true
 * 3. 请求头 x-format-time=true
 */
@Injectable()
export class TimeFormatInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 检查装饰器配置
        const formatType = this.reflector.get<string>(FORMAT_TIME_KEY, context.getHandler());

        // 检查请求参数或请求头
        const request = context.switchToHttp().getRequest();
        const queryFormatTime = request.query?.formatTime === 'true';
        const headerFormatTime = request.headers?.['x-format-time'] === 'true';

        // 确定格式化类型
        let shouldFormat = false;
        let format = 'chinese'; // 默认格式

        if (formatType) {
          shouldFormat = true;
          format = formatType;
        } else if (queryFormatTime || headerFormatTime) {
          shouldFormat = true;
          format = request.query?.timeFormat || 'chinese';
        }

        if (shouldFormat && data) {
          return this.formatResponseTime(data, format);
        }

        return data;
      }),
    );
  }

  /**
   * 格式化响应中的时间字段
   */
  private formatResponseTime(data: any, format: string = 'chinese'): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.formatResponseTime(item, format));
    }

    const formatted = { ...data };

    // 格式化响应时间戳
    if (formatted.timestamp) {
      formatted.timestamp = this.formatTimeByType(formatted.timestamp, format);
    }

    // 格式化数据中的时间字段
    if (formatted.data) {
      formatted.data = this.formatTimeFields(formatted.data, format);
    }

    return formatted;
  }

  /**
   * 递归格式化对象中的时间字段
   */
  private formatTimeFields(obj: any, format: string = 'chinese'): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.formatTimeFields(item, format));
    }

    const formatted = { ...obj };

    // 常见的时间字段名
    const timeFields = [
      'createdAt', 'updatedAt', 'createTime', 'updateTime',
      'uploadTime', 'lastSyncTime', 'timestamp'
    ];

    // 格式化时间字段
    timeFields.forEach(field => {
      if (formatted[field]) {
        formatted[field] = this.formatTimeByType(formatted[field], format);
      }
    });

    // 递归处理嵌套对象
    Object.keys(formatted).forEach(key => {
      if (formatted[key] && typeof formatted[key] === 'object') {
        formatted[key] = this.formatTimeFields(formatted[key], format);
      }
    });

    return formatted;
  }

  /**
   * 根据类型格式化时间
   */
  private formatTimeByType(time: any, format: string): string {
    switch (format) {
      case 'chinese':
        return DateFormatUtil.formatDateTime(time);
      case 'relative':
        return DateFormatUtil.formatRelativeTime(time);
      case 'iso':
      default:
        return typeof time === 'string' ? time : new Date(time).toISOString();
    }
  }
}
