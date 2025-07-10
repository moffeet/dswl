import { Injectable } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';

export interface CaptchaResult {
  id: string;
  svg: string;
}

@Injectable()
export class CaptchaService {
  private captchaStore = new Map<string, { text: string; expires: number }>();
  private readonly CAPTCHA_EXPIRES = 5 * 60 * 1000; // 5分钟过期

  /**
   * 生成验证码
   */
  generateCaptcha(): CaptchaResult {
    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      noise: 2, // 干扰线条数
      color: true, // 彩色
      background: '#f0f0f0', // 背景色
      width: 120, // 宽度
      height: 40, // 高度
      fontSize: 50, // 字体大小
      charPreset: '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', // 字符集（排除容易混淆的字符）
    });

    // 生成唯一ID
    const id = this.generateId();
    
    // 存储验证码（大小写不敏感）
    this.captchaStore.set(id, {
      text: captcha.text.toUpperCase(),
      expires: Date.now() + this.CAPTCHA_EXPIRES,
    });

    // 清理过期的验证码
    this.cleanExpiredCaptchas();

    console.log(`验证码生成成功: ID=${id}, 验证码=${captcha.text}`);

    return {
      id,
      svg: captcha.data,
    };
  }

  /**
   * 验证验证码
   */
  verifyCaptcha(id: string, userInput: string): boolean {
    const stored = this.captchaStore.get(id);
    
    if (!stored) {
      return false; // 验证码不存在
    }

    if (Date.now() > stored.expires) {
      this.captchaStore.delete(id); // 删除过期验证码
      return false; // 验证码已过期
    }

    // 验证成功后删除验证码（一次性使用）
    this.captchaStore.delete(id);
    
    // 大小写不敏感比较
    return stored.text === userInput.toUpperCase();
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * 清理过期的验证码
   */
  private cleanExpiredCaptchas(): void {
    const now = Date.now();
    for (const [id, data] of this.captchaStore.entries()) {
      if (now > data.expires) {
        this.captchaStore.delete(id);
      }
    }
  }

  /**
   * 获取当前存储的验证码数量（用于监控）
   */
  getCaptchaCount(): number {
    this.cleanExpiredCaptchas();
    return this.captchaStore.size;
  }

  /**
   * 开发环境专用：获取验证码文本内容
   * ⚠️ 仅用于开发测试，生产环境不应使用
   */
  getCaptchaText(id: string): string | null {
    // 仅在开发环境下提供
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    
    const stored = this.captchaStore.get(id);
    if (!stored || Date.now() > stored.expires) {
      return null;
    }
    
    return stored.text;
  }

  /**
   * 开发环境专用：获取所有当前有效的验证码
   * ⚠️ 仅用于开发测试，生产环境不应使用
   */
  getAllCaptchas(): Array<{id: string, text: string, expires: number}> {
    // 仅在开发环境下提供
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    this.cleanExpiredCaptchas();
    const result = [];
    for (const [id, data] of this.captchaStore.entries()) {
      result.push({
        id,
        text: data.text,
        expires: data.expires
      });
    }
    return result;
  }
}
