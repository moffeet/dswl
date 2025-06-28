import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { BlacklistService } from './blacklist.service';

export interface LoginConflictResult {
  hasConflict: boolean;
  conflictIp?: string;
  currentToken?: string;
}

@Injectable()
export class IpLimitService {
  constructor(
    private usersService: UsersService,
    private blacklistService: BlacklistService,
  ) {}

  /**
   * 检查用户是否在其他IP已登录
   */
  async checkLoginConflict(userId: number, currentIp: string): Promise<LoginConflictResult> {
    const user = await this.usersService.findOne(userId);
    
    if (!user) {
      return { hasConflict: false };
    }

    // 如果用户已经在其他IP登录
    if (user.currentLoginIp && user.currentLoginIp !== currentIp && user.currentToken) {
      return {
        hasConflict: true,
        conflictIp: user.currentLoginIp,
        currentToken: user.currentToken,
      };
    }

    return { hasConflict: false };
  }

  /**
   * 强制踢出其他会话
   */
  async forceLogoutOtherSessions(userId: number): Promise<void> {
    const user = await this.usersService.findOne(userId);
    
    if (user && user.currentToken) {
      // 将旧token加入黑名单
      this.blacklistService.addToBlacklist(user.currentToken);
    }
  }

  /**
   * 更新用户当前登录信息
   */
  async updateCurrentLogin(userId: number, ip: string, token: string): Promise<void> {
    await this.usersService.updateLoginInfo(userId, {
      lastLoginTime: new Date(),
      lastLoginIp: ip,
      currentLoginIp: ip,
      currentToken: token,
    });
  }

  /**
   * 清除用户当前登录信息（登出时调用）
   */
  async clearCurrentLogin(userId: number): Promise<void> {
    await this.usersService.updateLoginInfo(userId, {
      currentLoginIp: null,
      currentToken: null,
    });
  }

  /**
   * 获取IP地址的友好显示
   */
  getIpDisplay(ip: string): string {
    if (ip === '127.0.0.1' || ip === '::1') {
      return '本地';
    }
    
    // 可以集成IP地址库来获取地理位置信息
    return ip;
  }
} 