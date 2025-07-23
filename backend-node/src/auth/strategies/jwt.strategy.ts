import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { WxUsersService } from '../../wx-users/wx-users.service';
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
    private wxUsersService: WxUsersService,
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

    // 根据用户类型查找用户
    let user;
    if (payload.userType === 'wx-user') {
      // 小程序用户
      user = await this.wxUsersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('小程序用户不存在');
      }
    } else {
      // 管理员用户
      user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('管理员用户不存在');
      }
    }

    // 将用户类型添加到用户对象中，方便后续使用
    user.userType = payload.userType || 'admin';

    return user;
  }
} 