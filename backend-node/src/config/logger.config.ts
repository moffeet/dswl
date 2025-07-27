import { LoggerService, LogLevel } from '@nestjs/common';
import { Logger } from 'typeorm';
import * as winston from 'winston';
import * as path from 'path';
import 'winston-daily-rotate-file';

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, context, stack, traceId, ...meta }) => {
    const contextStr = context ? `[${context}] ` : '';
    const traceIdStr = traceId ? `[${traceId}] ` : '';
    const stackStr = stack ? `\n${stack}` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';

    return `${timestamp} [${level.toUpperCase()}] ${traceIdStr}${contextStr}${message}${metaStr}${stackStr}`;
  })
);

// 创建按周归档的日志传输器
const createDailyRotateTransport = (filename: string, level?: string) => {
  return new winston.transports.DailyRotateFile({
    filename: path.join(process.cwd(), '..', 'logs', `${filename}.log`), // 当前日志文件名
    datePattern: 'YYYY-MM-DD', // 按日期归档：2025-01-09
    zippedArchive: true, // 压缩旧日志
    maxSize: '50m', // 单个文件最大50MB
    maxFiles: '90d', // 保留90天的日志
    level: level,
    format: logFormat,
    auditFile: path.join(process.cwd(), '..', 'logs', `.${filename}-audit.json`),
    // 归档文件名格式：filename-YYYY-MM-DD.log
    createSymlink: false, // 不创建符号链接
    symlinkName: null, // 不使用符号链接名
    // 自定义归档文件名
    options: {
      flags: 'a' // 追加模式
    }
  });
};

// 创建Winston logger实例
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // 控制台输出（始终显示时间戳）
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),

    // 按周归档 - 所有日志
    createDailyRotateTransport('backend'),

    // 按周归档 - 仅错误日志
    createDailyRotateTransport('error', 'error'),

    // 按周归档 - 数据库日志
    createDailyRotateTransport('database', 'info'),

    // 按周归档 - 安全日志
    createDailyRotateTransport('security', 'warn')
  ]
});

// 请求追踪ID管理
class TraceIdManager {
  private static traceIdStorage = new Map<string, string>();

  static generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static setTraceId(key: string, traceId: string): void {
    this.traceIdStorage.set(key, traceId);
  }

  static getTraceId(key?: string): string | undefined {
    if (!key) return undefined;
    return this.traceIdStorage.get(key);
  }

  static clearTraceId(key: string): void {
    this.traceIdStorage.delete(key);
  }
}

// NestJS Logger适配器
export class CustomLogger implements LoggerService {
  private context?: string;
  private traceId?: string;

  constructor(context?: string, traceId?: string) {
    this.context = context;
    this.traceId = traceId;
  }

  setContext(context: string) {
    this.context = context;
  }

  setTraceId(traceId: string) {
    this.traceId = traceId;
  }

  log(message: any, context?: string, traceId?: string) {
    const ctx = context || this.context;
    const tid = traceId || this.traceId;
    winstonLogger.info(message, { context: ctx, traceId: tid });
  }

  error(message: any, stack?: string, context?: string, traceId?: string) {
    const ctx = context || this.context;
    const tid = traceId || this.traceId;
    winstonLogger.error(message, { context: ctx, stack, traceId: tid });
  }

  warn(message: any, context?: string, traceId?: string) {
    const ctx = context || this.context;
    const tid = traceId || this.traceId;
    winstonLogger.warn(message, { context: ctx, traceId: tid });
  }

  debug(message: any, context?: string, traceId?: string) {
    const ctx = context || this.context;
    const tid = traceId || this.traceId;
    winstonLogger.debug(message, { context: ctx, traceId: tid });
  }

  verbose(message: any, context?: string, traceId?: string) {
    const ctx = context || this.context;
    const tid = traceId || this.traceId;
    winstonLogger.verbose(message, { context: ctx, traceId: tid });
  }

  // 数据库专用日志方法
  logDatabase(message: any, level: 'info' | 'warn' | 'error' = 'info', traceId?: string) {
    const tid = traceId || this.traceId;
    const logMethod = winstonLogger[level];
    logMethod(message, {
      context: 'Database',
      traceId: tid,
      category: 'database'
    });
  }

  // 安全专用日志方法
  logSecurity(message: any, level: 'warn' | 'error' = 'warn', traceId?: string) {
    const tid = traceId || this.traceId;
    const logMethod = winstonLogger[level];
    logMethod(message, {
      context: 'Security',
      traceId: tid,
      category: 'security'
    });
  }
}

// 数据库专用Logger - 实现TypeORM Logger接口
export class DatabaseLogger extends CustomLogger implements Logger {
  constructor() {
    super('Database');
  }

  logQuery(query: string, parameters?: any[], queryRunner?: any) {
    const paramStr = parameters && parameters.length > 0
      ? ` -- Parameters: [${parameters.join(', ')}]`
      : '';

    this.logDatabase(`SQL Query: ${query}${paramStr}`, 'info');
  }

  logQueryError(error: string, query: string, parameters?: any[], queryRunner?: any) {
    const paramStr = parameters && parameters.length > 0
      ? ` -- Parameters: [${parameters.join(', ')}]`
      : '';

    this.logDatabase(`SQL Query Failed: ${query}${paramStr} -- Error: ${error}`, 'error');
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: any) {
    const paramStr = parameters && parameters.length > 0
      ? ` -- Parameters: [${parameters.join(', ')}]`
      : '';

    this.logDatabase(`Slow Query (${time}ms): ${query}${paramStr}`, 'warn');
  }

  logSchemaBuild(message: string, queryRunner?: any) {
    this.logDatabase(`Schema: ${message}`, 'info');
  }

  logMigration(message: string, queryRunner?: any) {
    this.logDatabase(`Migration: ${message}`, 'info');
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: any) {
    const logLevel = level === 'log' ? 'info' : level;
    this.logDatabase(`TypeORM: ${message}`, logLevel as 'info' | 'warn');
  }
}

// 导出logger实例
export const logger = new CustomLogger();
export const databaseLogger = new DatabaseLogger();
export { winstonLogger, TraceIdManager };
