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
    let actualPassword: string;
    
    // 🔒 安全改进：检查是否为加密数据
    if (loginDto._encrypted && loginDto.timestamp && loginDto.signature) {
      console.log('检测到加密登录数据，开始解密处理');
      
      // 导入解密工具
      const { decryptPassword, validateTimestamp, validateSignature } = await import('./utils/crypto.util');
      
      // 验证签名
      if (!validateSignature(loginDto.username, loginDto.password, loginDto.timestamp, loginDto.signature)) {
        throw new UnauthorizedException('数据签名验证失败');
      }
      
      // 验证时间戳（防重放攻击）
      if (!validateTimestamp(loginDto.timestamp)) {
        throw new UnauthorizedException('请求已过期，请重新登录');
      }
      
      try {
        // 解密密码
        const decryptedData = decryptPassword(loginDto.password);
        actualPassword = decryptedData.password;
        console.log('密码解密成功');
      } catch (error) {
        console.error('密码解密失败:', error);
        throw new UnauthorizedException('密码解密失败');
      }
    } else {
      // 兼容明文密码（向后兼容）
      console.log('使用明文密码登录（建议升级到加密传输）');
      actualPassword = loginDto.password;
    }
    
    const user = await this.validateUser(loginDto.username, actualPassword);
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查是否首次登录
    if (user.isFirstLogin === 1) {
      // 首次登录，返回特殊状态要求修改密码
      return {
        requirePasswordChange: true,
        userId: user.id,
        username: user.username,
        message: '首次登录，请修改密码'
      };
    }

    // 获取当前IP
    const currentIp = this.extractIpAddress(req);

    // 自动踢出其他会话（正常的业务逻辑）
    // 如果用户在其他地方有登录，自动使其失效
    await this.ipLimitService.forceLogoutOtherSessions(user.id);

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

  async changePassword(userId: number, newPassword: string): Promise<void> {
    await this.usersService.changePassword(userId, newPassword);
  }
}