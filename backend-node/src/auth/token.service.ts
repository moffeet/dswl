import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomLogger } from '../config/logger.config';
import { BlacklistService } from './blacklist.service';
import { TokenResponseDto } from './dto/token.dto';

export interface TokenPayload {
  sub: number;
  username: string;
  phone?: string;
  role?: string;
  userType: 'admin' | 'wx-user';
  type?: 'access' | 'refresh';
}

@Injectable()
export class TokenService {
  private readonly logger = new CustomLogger('TokenService');

  // Access Token 有效期：2小时
  private readonly ACCESS_TOKEN_EXPIRES_IN = '2h';
  // Refresh Token 有效期：7天
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  constructor(
    private readonly jwtService: JwtService,
    private readonly blacklistService: BlacklistService,
  ) {}

  /**
   * 生成双token
   * @param payload 用户信息
   * @returns 包含access token和refresh token的对象
   */
  generateTokens(payload: Omit<TokenPayload, 'type'>): TokenResponseDto {
    // 生成Access Token
    const accessTokenPayload: TokenPayload = {
      ...payload,
      type: 'access'
    };
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN
    });

    // 生成Refresh Token
    const refreshTokenPayload: TokenPayload = {
      sub: payload.sub,
      username: payload.username,
      userType: payload.userType,
      type: 'refresh'
    };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN
    });

    this.logger.log(`生成双token成功 - 用户ID: ${payload.sub}, 用户类型: ${payload.userType}`);

    return {
      accessToken,
      refreshToken,
      expiresIn: 2 * 60 * 60, // 2小时，单位秒
      tokenType: 'Bearer'
    };
  }

  /**
   * 刷新Access Token
   * @param refreshToken Refresh Token
   * @returns 新的token对
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      // 检查refresh token是否在黑名单中
      if (this.blacklistService.isBlacklisted(refreshToken)) {
        throw new UnauthorizedException('Refresh Token已失效');
      }

      // 验证refresh token
      const payload = this.jwtService.verify(refreshToken) as TokenPayload;
      
      // 检查token类型
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('无效的Refresh Token');
      }

      // 将旧的refresh token加入黑名单
      this.blacklistService.addToBlacklist(refreshToken);

      // 生成新的token对
      const newTokens = this.generateTokens({
        sub: payload.sub,
        username: payload.username,
        userType: payload.userType
      });

      this.logger.log(`刷新token成功 - 用户ID: ${payload.sub}`);

      return newTokens;
    } catch (error) {
      this.logger.error(`刷新token失败: ${error.message}`);
      throw new UnauthorizedException('Refresh Token无效或已过期');
    }
  }

  /**
   * 验证Access Token
   * @param accessToken Access Token
   * @returns 解码后的payload
   */
  verifyAccessToken(accessToken: string): TokenPayload {
    try {
      // 检查token是否在黑名单中
      if (this.blacklistService.isBlacklisted(accessToken)) {
        throw new UnauthorizedException('Token已失效');
      }

      const payload = this.jwtService.verify(accessToken) as TokenPayload;
      
      // 检查token类型
      if (payload.type !== 'access') {
        throw new UnauthorizedException('无效的Access Token');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Access Token无效或已过期');
    }
  }

  /**
   * 撤销token（登出时调用）
   * @param accessToken Access Token
   * @param refreshToken Refresh Token
   */
  revokeTokens(accessToken?: string, refreshToken?: string): void {
    if (accessToken) {
      this.blacklistService.addToBlacklist(accessToken);
    }
    if (refreshToken) {
      this.blacklistService.addToBlacklist(refreshToken);
    }
    this.logger.log('Token已撤销');
  }

  /**
   * 获取token过期时间信息
   */
  getTokenExpirationInfo() {
    return {
      accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      accessTokenSeconds: 2 * 60 * 60, // 2小时
      refreshTokenSeconds: 7 * 24 * 60 * 60 // 7天
    };
  }
}
