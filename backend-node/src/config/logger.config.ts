import { LoggerService, LogLevel } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, context, stack }) => {
    const contextStr = context ? `[${context}] ` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${contextStr}${message}${stackStr}`;
  })
);

// 创建Winston logger实例
const winstonLogger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // 文件输出 - 所有日志
    new winston.transports.File({
      filename: path.join(process.cwd(), '..', 'logs', 'backend.log'),
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    // 文件输出 - 仅错误日志
    new winston.transports.File({
      filename: path.join(process.cwd(), '..', 'logs', 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  ]
});

// NestJS Logger适配器
export class CustomLogger implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    const ctx = context || this.context;
    winstonLogger.info(message, { context: ctx });
  }

  error(message: any, stack?: string, context?: string) {
    const ctx = context || this.context;
    winstonLogger.error(message, { context: ctx, stack });
  }

  warn(message: any, context?: string) {
    const ctx = context || this.context;
    winstonLogger.warn(message, { context: ctx });
  }

  debug(message: any, context?: string) {
    const ctx = context || this.context;
    winstonLogger.debug(message, { context: ctx });
  }

  verbose(message: any, context?: string) {
    const ctx = context || this.context;
    winstonLogger.verbose(message, { context: ctx });
  }
}

// 导出logger实例
export const logger = new CustomLogger();
export { winstonLogger };
