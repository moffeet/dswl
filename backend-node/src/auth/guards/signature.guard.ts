import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SignatureService, SignatureParams } from '../signature.service';
import { WxUsersService } from '../../wx-users/wx-users.service';
import { REQUIRE_SIGNATURE_KEY } from '../decorators/require-signature.decorator';
import { CustomLogger } from '../../config/logger.config';

@Injectable()
export class SignatureGuard implements CanActivate {
  private readonly logger = new CustomLogger('SignatureGuard');

  constructor(
    private reflector: Reflector,
    private signatureService: SignatureService,
    private wxUsersService: WxUsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否需要签名校验
    const requireSignature = this.reflector.getAllAndOverride<boolean>(REQUIRE_SIGNATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireSignature) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    try {
      // 1. 提取签名参数
      const signatureParams = this.extractSignatureParams(request);
      
      // 2. 获取用户ID（从请求参数中获取）
      const userId = this.extractUserId(request);
      if (!userId) {
        throw new UnauthorizedException('缺少用户标识');
      }

      // 3. 验证用户是否存在
      const user = await this.wxUsersService.findOne(userId);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      // 4. 获取用户的签名密钥
      const secretKey = this.signatureService.getUserSignatureKey(userId);

      // 5. 验证签名
      const validationResult = this.signatureService.validateSignature(signatureParams, secretKey);
      
      if (!validationResult.isValid) {
        this.logger.warn(`签名校验失败 - 用户ID: ${userId}, 错误: ${validationResult.error}`);
        throw new UnauthorizedException(`签名校验失败: ${validationResult.error}`);
      }

      this.logger.log(`签名校验成功 - 用户ID: ${userId}, 用户: ${user.name}`);
      
      // 6. 将用户信息添加到请求对象中，供后续使用
      request['wxUser'] = user;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`签名校验异常: ${error.message}`, error.stack);
      throw new UnauthorizedException('签名校验失败');
    }
  }

  /**
   * 提取签名参数
   * 支持从query参数、body参数和header中提取
   */
  private extractSignatureParams(request: Request): SignatureParams {
    const allParams: Record<string, any> = {
      ...request.query,
      ...request.body,
    };

    // 从header中提取签名参数（可选）
    const timestamp = request.headers['x-timestamp'] as string || allParams.timestamp;
    const nonce = request.headers['x-nonce'] as string || allParams.nonce;
    const signature = request.headers['x-signature'] as string || allParams.signature;

    if (!timestamp || !nonce || !signature) {
      throw new UnauthorizedException('缺少签名参数：timestamp、nonce、signature');
    }

    return {
      ...allParams,
      timestamp,
      nonce,
      signature,
    };
  }

  /**
   * 提取用户ID
   * 从请求参数中提取用户标识
   */
  private extractUserId(request: Request): number | null {
    // 优先从body中获取
    let userId = request.body?.wxUserId || request.body?.userId;
    
    // 其次从query参数中获取
    if (!userId) {
      userId = request.query?.wxUserId || request.query?.userId;
    }

    // 最后从header中获取
    if (!userId) {
      userId = request.headers['x-user-id'];
    }

    if (!userId) {
      return null;
    }

    const userIdNum = parseInt(userId as string, 10);
    return isNaN(userIdNum) ? null : userIdNum;
  }
}
