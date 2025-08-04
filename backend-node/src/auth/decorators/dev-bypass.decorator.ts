import { SetMetadata } from '@nestjs/common';

/**
 * 开发环境认证绕过装饰器
 * 
 * 使用此装饰器标记的接口在开发环境下可以通过请求头参数跳过认证
 * 
 * 使用方法：
 * @DevBypass()
 * @Get('some-endpoint')
 * async someMethod() { ... }
 * 
 * 前端调用时在请求头中添加：
 * X-Dev-Skip-Auth: false  // 跳过认证
 * X-Dev-Skip-Auth: true   // 正常认证
 * 
 * 注意：此功能仅在开发环境（NODE_ENV !== 'production'）下生效
 */
export const DEV_BYPASS_KEY = 'devBypass';
export const DevBypass = () => SetMetadata(DEV_BYPASS_KEY, true);
