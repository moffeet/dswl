import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, req?: any): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      nickname: user.nickname,
      roles: user.roles || [],
      userType: 'admin', // 可以根据用户角色来判断
    };

    const accessToken = this.jwtService.sign(payload);

    // 更新最后登录时间和IP
    await this.updateLastLogin(user.id, req);

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



  async logout(userId: number): Promise<{ message: string }> {
    // 可以在这里添加黑名单机制，将token加入黑名单
    // 目前简单返回成功消息
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

  private async updateLastLogin(userId: number, req?: any): Promise<void> {
    try {
      const updateData: any = {
        lastLoginTime: new Date(),
      };

      // 如果有请求对象，尝试获取IP地址
      if (req) {
        const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                  (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                  req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '127.0.0.1';
        updateData.lastLoginIp = Array.isArray(ip) ? ip[0] : ip;
      }

      await this.usersService.updateLoginInfo(userId, updateData);
    } catch (error) {
      // 记录登录信息失败不影响登录流程
      console.error('更新登录信息失败:', error);
    }
  }


} 