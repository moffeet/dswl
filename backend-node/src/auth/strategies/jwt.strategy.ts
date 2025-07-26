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
  deviceId?: string; // 设备唯一标识
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

      // 小程序用户必须进行设备验证
      const currentDeviceId = req.headers['x-device-id'] || req.headers['device-id'];

      if (payload.deviceId) {
        // Token中有设备ID，进行严格验证

        // 1. 检查请求头中是否提供了设备ID
        if (!currentDeviceId) {
          throw new UnauthorizedException('请求头中缺少设备标识，请重新登录');
        }

        // 2. 验证设备ID是否匹配
        if (currentDeviceId !== payload.deviceId) {
          throw new UnauthorizedException('设备标识不匹配，请重新登录');
        }

        // 3. 验证设备是否仍然绑定到该用户（检查数据库中的设备信息）
        if (!user.deviceId) {
          // 数据库中没有设备绑定信息，可能被管理员重置了
          throw new UnauthorizedException('设备绑定已被重置，请重新登录');
        }

        // 4. 验证设备是否匹配数据库记录
        if (user.deviceId !== payload.deviceId) {
          throw new UnauthorizedException('设备绑定信息不一致，请重新登录');
        }
      } else {
        // Token中没有设备ID（可能是旧版本token），要求重新登录
        throw new UnauthorizedException('Token缺少设备信息，请重新登录');
      }
    } else {
      // 管理员用户
      user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('管理员用户不存在');
      }
    }

    // 将用户类型和设备信息添加到用户对象中，方便后续使用
    user.userType = payload.userType || 'admin';
    user.deviceId = payload.deviceId;

    return user;
  }
} 