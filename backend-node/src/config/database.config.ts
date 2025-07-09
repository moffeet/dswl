import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Customer } from '../customers/entities/customer.entity';
import { WxUser } from '../wx-users/entities/wx-user.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { Logger } from 'typeorm';

// 自定义数据库日志记录器，添加时间戳
class DatabaseLogger implements Logger {
  logQuery(query: string, parameters?: any[]) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
    const paramStr = parameters && parameters.length > 0
      ? ` -- Parameters: [${parameters.join(', ')}]`
      : '';
    console.log(`${timestamp} [INFO] [SQL] ${query}${paramStr}`);
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
    const paramStr = parameters && parameters.length > 0
      ? ` -- Parameters: [${parameters.join(', ')}]`
      : '';
    console.error(`${timestamp} [ERROR] [SQL] Query failed: ${query}${paramStr} -- Error: ${error}`);
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
    const paramStr = parameters && parameters.length > 0
      ? ` -- Parameters: [${parameters.join(', ')}]`
      : '';
    console.warn(`${timestamp} [WARN] [SQL] Slow query (${time}ms): ${query}${paramStr}`);
  }

  logSchemaBuild(message: string) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
    console.log(`${timestamp} [INFO] [Schema] ${message}`);
  }

  logMigration(message: string) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
    console.log(`${timestamp} [INFO] [Migration] ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
    const levelStr = level.toUpperCase();
    console.log(`${timestamp} [${levelStr}] [TypeORM] ${message}`);
  }
}

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || '123456',
  database: process.env.DATABASE_NAME || 'logistics_db',
  entities: [User, Role, Permission, Customer, WxUser, Receipt],
  synchronize: false, // 关闭自动同步，使用现有数据库结构
  logging: ['query', 'error', 'warn', 'info', 'log'], // 启用详细日志记录
  logger: new DatabaseLogger(), // 使用自定义日志记录器
  maxQueryExecutionTime: 1000, // 慢查询阈值：1秒
  timezone: '+08:00',
  charset: 'utf8mb4',
  extra: {
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    connectionLimit: 10,
  },
};