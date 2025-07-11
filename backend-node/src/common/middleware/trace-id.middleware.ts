import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TraceIdManager } from '../../config/logger.config';

// 扩展Request接口以包含traceId
declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
}

/**
 * 请求追踪ID中间件
 * 为每个HTTP请求生成唯一的追踪ID，用于日志关联
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 生成唯一的追踪ID
    const traceId = TraceIdManager.generateTraceId();
    
    // 将traceId添加到请求对象
    req.traceId = traceId;
    
    // 将traceId添加到响应头（可选，便于调试）
    res.setHeader('X-Trace-Id', traceId);
    
    // 存储到TraceIdManager中（如果需要在其他地方访问）
    TraceIdManager.setTraceId(req.url, traceId);
    
    // 请求结束时清理
    res.on('finish', () => {
      TraceIdManager.clearTraceId(req.url);
    });
    
    next();
  }
}
