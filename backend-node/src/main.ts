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
  });

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
  });

  // 设置全局API前缀
  app.setGlobalPrefix('api');

  // 全局管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // 临时设置为false以调试
    transform: true,
    exceptionFactory: (errors) => {
      console.log('Validation errors:', JSON.stringify(errors, null, 2));
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
    },
  });

  // 启动服务
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`应用程序运行在: http://localhost:${port}`);
  console.log(`API文档地址: http://localhost:${port}/api`);
}

bootstrap(); 