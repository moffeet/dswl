import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// import { UsersModule } from './users/users.module';
// import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module.simple';
// import { DriversModule } from './drivers/drivers.module';
// import { CheckinModule } from './checkin/checkin.module';
// import { UploadModule } from './common/upload.module';
import { HealthController } from './common/health.controller';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 数据库配置 - 暂时禁用
    // TypeOrmModule.forRoot(databaseConfig),

    // 静态文件服务
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'uploads'),
        serveRoot: '/uploads',
      },
      {
        rootPath: join(__dirname, '..', 'public'),
        serveRoot: '/',
      }
    ),

    // 业务模块 - 暂时禁用
    // UsersModule,
    // AuthModule,
    CustomersModule,
    // DriversModule,
    // CheckinModule,
    // UploadModule,
  ],
  controllers: [HealthController],
})
export class AppModule {} 