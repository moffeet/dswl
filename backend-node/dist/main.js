"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = process.env.PORT || 3000;
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('物流配送管理系统API')
        .setDescription(`
      ## 物流配送管理系统后端API文档
      
      ### 功能模块
      - 👥 **客户管理**: 客户信息的增删改查
      - 🚚 **司机管理**: 司机信息管理
      - 📍 **打卡记录**: 司机打卡签到管理
      - 👤 **用户管理**: 系统用户管理
      - 🔐 **认证授权**: 登录认证和权限控制
      
      ### 接口规范
      - **基础URL**: http://localhost:3001
      - **数据格式**: JSON
      - **字符编码**: UTF-8
      - **请求头**: Content-Type: application/json
      
      ### 统一响应格式
      \`\`\`json
      {
        "code": 0,           // 状态码：0=成功，其他=失败
        "message": "操作成功", // 提示信息
        "data": {},          // 响应数据
        "total": 100,        // 总数（列表接口）
        "page": 1,           // 当前页（列表接口）
        "limit": 10          // 每页数量（列表接口）
      }
      \`\`\`
      
      ### 常用错误码
      - **0**: 操作成功
      - **400**: 请求参数错误
      - **404**: 资源不存在
      - **500**: 服务器内部错误
    `)
        .setVersion('1.0')
        .setContact('开发团队', 'http://localhost:3001', 'dev@example.com')
        .addServer('http://localhost:3001', '开发环境')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(port);
    console.log(`应用程序运行在: http://localhost:${port}`);
    console.log(`API文档地址: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map