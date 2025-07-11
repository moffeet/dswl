import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { UploadConfig } from './config/upload.config';
import { TraceIdMiddleware } from './common/middleware/trace-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { WxUsersModule } from './wx-users/wx-users.module';
import { ReceiptsModule } from './receipts/receipts.module';

import { MiniprogramModule } from './miniprogram/miniprogram.module';
import { TasksModule } from './tasks/tasks.module';
import { HealthController } from './common/health.controller';
import { TestExceptionController } from './common/test-exception.controller';
import { LogsController } from './common/controllers/logs.controller';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 数据库配置
    TypeOrmModule.forRoot(databaseConfig),

    // 静态文件服务
    ServeStaticModule.forRoot(
      {
        rootPath: (() => {
          try {
            const uploadDir = UploadConfig.getUploadRootPath();
            return UploadConfig.ensureDirectoryExists(uploadDir);
          } catch (error) {
            // 静态文件服务配置失败时使用默认路径
            return join(__dirname, '..', 'uploads');
          }
        })(),
        serveRoot: '/receipts/uploads',
      },
      {
        rootPath: join(__dirname, '..', 'public'),
        serveRoot: '/',
      }
    ),

    // 业务模块
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
    CustomersModule,
    WxUsersModule,
    ReceiptsModule,

    // 小程序模块
    MiniprogramModule,

    // 定时任务模块
    TasksModule,
  ],
  controllers: [
    HealthController,
    // 仅在开发环境添加异常测试控制器
    TestExceptionController,
    // 日志管理控制器
    LogsController,
  ],
  providers: [
    // 全局日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 应用请求追踪ID中间件到所有路由
    consumer
      .apply(TraceIdMiddleware)
      .forRoutes('*');
  }
}