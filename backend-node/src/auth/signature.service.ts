import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { CustomLogger } from '../config/logger.config';

@Injectable()
export class SignatureService {
  private readonly logger = new CustomLogger('SignatureService');

  /**
   * 生成随机字符串
   * @param length 长度，默认16位
   * @returns 随机字符串
   */
  generateRandomString(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 获取当前时间戳
   * @returns 当前时间戳
   */
  getCurrentTimestamp(): string {
    return Date.now().toString();
  }

  /**
   * 生成HMAC签名（保留用于其他用途）
   * @param data 要签名的数据
   * @param secretKey 签名密钥
   * @returns 签名字符串
   */
  generateHmacSignature(data: string, secretKey: string): string {
    return createHmac('sha256', secretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * 验证HMAC签名
   * @param data 原始数据
   * @param signature 签名
   * @param secretKey 签名密钥
   * @returns 是否验证通过
   */
  verifyHmacSignature(data: string, signature: string, secretKey: string): boolean {
    const expectedSignature = this.generateHmacSignature(data, secretKey);
    return signature === expectedSignature;
  }
}
