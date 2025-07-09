import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CustomLogger } from './config/logger.config';
import * as dotenv from 'dotenv';

// 显式加载环境变量
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger('Bootstrap'),
    bodyParser: true,
    // 增加请求体解析限制
    rawBody: true,
  });

  // 配置Express应用的超时和限制
  const server = app.getHttpServer();
  
  // 增加请求超时时间（60秒）
  server.setTimeout(60000);
  
  // 增加保持连接超时时间
  server.keepAliveTimeout = 65000;
  
  // 增加头部超时时间
  server.headersTimeout = 66000;

  // CORS配置
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:3004',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3004',
      'http://49.235.60.148:3000',
      'http://49.235.60.148:3001',
      'http://49.235.60.148:3002',
      'http://49.235.60.148:3004'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    // 增加预检请求缓存时间
    maxAge: 86400, // 24小时
  });

  // 设置全局API前缀
  app.setGlobalPrefix('api');

  // 全局管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    // 增加验证选项
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors) => {
      return new BadRequestException(errors);
    },
  }));

  // Swagger配置
  const config = new DocumentBuilder()
    .setTitle('物流配送管理系统 API')
    .setDescription('物流配送管理系统的后端API文档')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    }, 'Authorization')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      // 增加Swagger UI的请求超时
      requestTimeout: 60000,
    },
  });

  // 启动服务
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // 绑定到所有网络接口

  const logger = new CustomLogger('Bootstrap');
  logger.log(`应用程序运行在: http://localhost:${port}`);
  logger.log(`API文档地址: http://localhost:${port}/api`);
  logger.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`超时配置: 服务器超时 60s, Keep-Alive 65s, Headers 66s`);
}

bootstrap().catch(error => {
  const logger = new CustomLogger('Bootstrap');
  logger.error('应用启动失败:', error);
  process.exit(1);
}); 