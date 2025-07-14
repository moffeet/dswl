import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { BlacklistService } from './blacklist.service';
import { IpLimitService } from './ip-limit.service';
import { CaptchaService } from './captcha.service';
import { CustomLogger } from '../config/logger.config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new CustomLogger('AuthService');

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private blacklistService: BlacklistService,
    private ipLimitService: IpLimitService,
    private captchaService: CaptchaService,
  ) {}

  async login(loginDto: LoginDto, req?: any, forceLogin?: boolean): Promise<LoginResponseDto> {
    // 🔐 验证码校验
    if (!this.captchaService.verifyCaptcha(loginDto.captchaId, loginDto.captchaCode)) {
      throw new UnauthorizedException('验证码错误或已过期');
    }

    let actualPassword: string;

    // 🔒 安全改进：检查是否为加密数据（去掉签名验证）
    if (loginDto._encrypted && loginDto.password) {
      this.logger.log('检测到加密登录数据，开始解密处理（无签名验证）');

      // 导入解密工具
      const { decryptPassword } = await import('./utils/crypto.util');

      try {
        // 解密密码（不再验证签名和时间戳）
        const decryptedData = decryptPassword(loginDto.password);
        actualPassword = decryptedData.password;
        this.logger.log('密码解密成功');
      } catch (error) {
        this.logger.error('密码解密失败', error.stack);
        throw new UnauthorizedException('密码解密失败');
      }
    } else {
      // 兼容明文密码（向后兼容）
      console.log('使用明文密码登录');
      actualPassword = loginDto.password;
    }
    
    const user = await this.validateUser(loginDto.username, actualPassword);
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查是否首次登录（通过账号和密码是否相同判断）
    const isFirstLogin = user.username === actualPassword;
    if (isFirstLogin) {
      // 首次登录，正常生成JWT Token，但标记需要修改密码
      const payload = {
        sub: user.id,
        username: user.username,
        nickname: user.nickname,
        roles: user.roles || [],
        userType: 'admin',
        isFirstLogin: true, // 标记首次登录
      };

      const accessToken = this.jwtService.sign(payload);

      // 更新登录信息
      await this.updateLastLogin(user.id, req);

      return {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          roles: user.roles || []
        },
        requirePasswordChange: true, // 标记需要修改密码
        message: '首次登录，建议修改密码'
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
      this.logger.error('更新登录信息失败', error.stack);
    }
  }

  async changePassword(userId: number, newPassword: string): Promise<void> {
    await this.usersService.changePassword(userId, newPassword);
  }

  async updatePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    // 获取用户信息
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证原密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('原密码错误');
    }

    // 验证新密码不能与原密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new UnauthorizedException('新密码不能与原密码相同');
    }

    // 调用用户服务更新密码
    await this.usersService.changePassword(userId, newPassword);
  }
}