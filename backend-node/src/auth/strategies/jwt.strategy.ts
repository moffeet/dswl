import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { BlacklistService } from '../blacklist.service';

export interface JwtPayload {
  sub: number;
  username: string;
  userType: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private blacklistService: BlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'logistics-system-jwt-secret-2024',
      passReqToCallback: true, // 允许在validate方法中访问request
    });
  }

  async validate(req: any, payload: JwtPayload) {
    // 检查payload是否有效
    if (!payload || !payload.sub || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Token格式无效');
    }

    // 检查token是否在黑名单中
    const authHeader = req.headers.authorization;
    const token = this.blacklistService.extractToken(authHeader);

    if (token && this.blacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token已失效，请重新登录');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }
} 