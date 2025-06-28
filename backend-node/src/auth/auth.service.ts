import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { BlacklistService } from './blacklist.service';
import { IpLimitService } from './ip-limit.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private blacklistService: BlacklistService,
    private ipLimitService: IpLimitService,
  ) {}

  async login(loginDto: LoginDto, req?: any, forceLogin?: boolean): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 获取当前IP
    const currentIp = this.extractIpAddress(req);
    
    // 检查IP登录冲突（除非强制登录）
    if (!forceLogin) {
      const conflict = await this.ipLimitService.checkLoginConflict(user.id, currentIp);
      if (conflict.hasConflict) {
        throw new UnauthorizedException(`账号已在其他位置登录 (${this.ipLimitService.getIpDisplay(conflict.conflictIp!)}), 如需继续登录请选择强制登录`);
      }
    } else {
      // 强制登录时，踢出其他会话
      await this.ipLimitService.forceLogoutOtherSessions(user.id);
    }

    const payload = {
      sub: user.id,
      username: user.username,
      nickname: user.nickname,
      roles: user.roles || [],
      userType: 'admin', // 可以根据用户角色来判断
    };

    const accessToken = this.jwtService.sign(payload);

    // 更新登录信息
    await this.ipLimitService.updateCurrentLogin(user.id, currentIp, accessToken);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        status: user.status,
        roles: user.roles || [],
      },
    };
  }



  async logout(userId: number, token?: string): Promise<{ message: string }> {
    // 将token加入黑名单
    if (token) {
      this.blacklistService.addToBlacklist(token);
    }
    
    // 清除当前登录信息
    await this.ipLimitService.clearCurrentLogin(userId);
    
    return { message: '登出成功' };
  }

  private async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      return null;
    }

    if (user.status !== 'normal') {
      throw new UnauthorizedException('用户账号已被禁用');
    }

    // 使用bcrypt验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private extractIpAddress(req?: any): string {
    if (!req) {
      return '127.0.0.1';
    }
    
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 
              (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
              req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '127.0.0.1';
    
    return Array.isArray(ip) ? ip[0] : ip;
  }

  private async updateLastLogin(userId: number, req?: any): Promise<void> {
    try {
      const updateData: any = {
        lastLoginTime: new Date(),
      };

      // 如果有请求对象，尝试获取IP地址
      if (req) {
        const ip = this.extractIpAddress(req);
        updateData.lastLoginIp = ip;
      }

      await this.usersService.updateLoginInfo(userId, updateData);
    } catch (error) {
      // 记录登录信息失败不影响登录流程
      console.error('更新登录信息失败:', error);
    }
  }


} 