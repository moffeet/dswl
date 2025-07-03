import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Customer } from '../customers/entities/customer.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || '123456',
  database: process.env.DATABASE_NAME || 'logistics_db',
  entities: [User, Role, Permission, Customer],
  synchronize: false, // 关闭自动同步，使用现有数据库结构
  logging: true,
  timezone: '+08:00',
  charset: 'utf8mb4',
  extra: {
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    connectionLimit: 10,
  },
}; 