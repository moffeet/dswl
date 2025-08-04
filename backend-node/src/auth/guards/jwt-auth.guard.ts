import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { DEV_BYPASS_KEY } from '../decorators/dev-bypass.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 检查是否为公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 开发环境认证绕过检查
    const canDevBypass = this.reflector.getAllAndOverride<boolean>(DEV_BYPASS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (canDevBypass && process.env.NODE_ENV !== 'production') {
      const request = context.switchToHttp().getRequest();
      const skipAuth = request.headers['x-dev-skip-auth'];

      // 如果请求头中 X-Dev-Skip-Auth 为 'false'，则跳过认证
      if (skipAuth === 'false') {
        console.log('🔓 [开发模式] 跳过JWT认证验证');
        return true;
      }
    }

    return super.canActivate(context);
  }
}