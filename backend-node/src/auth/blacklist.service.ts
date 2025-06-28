import { Injectable } from '@nestjs/common';

@Injectable()
export class BlacklistService {
  private blacklistedTokens = new Set<string>();
  
  /**
   * 将token添加到黑名单
   */
  addToBlacklist(token: string): void {
    this.blacklistedTokens.add(token);
    
    // 可以添加过期清理机制
    // 30天后自动清理（与JWT过期时间一致）
    setTimeout(() => {
      this.blacklistedTokens.delete(token);
    }, 30 * 24 * 60 * 60 * 1000); // 30天
  }
  
  /**
   * 检查token是否在黑名单中
   */
  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
  
  /**
   * 从token中提取实际的token值（去掉Bearer前缀）
   */
  extractToken(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7); // 去掉"Bearer "
  }
  
  /**
   * 清理所有黑名单token（仅供测试使用）
   */
  clearAll(): void {
    this.blacklistedTokens.clear();
  }
  
  /**
   * 获取黑名单大小（仅供调试使用）
   */
  getSize(): number {
    return this.blacklistedTokens.size;
  }
} 