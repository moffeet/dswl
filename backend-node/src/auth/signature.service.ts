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

  /**
   * 获取用户的签名密钥（保留用于兼容性）
   * 这里可以根据用户ID从数据库获取，或者使用固定规则生成
   * @param userId 用户ID
   * @returns 签名密钥
   */
  getUserSignatureKey(userId: number): string {
    // 这里使用一个基础密钥 + 用户ID的方式生成用户专属密钥
    // 在生产环境中，建议将密钥存储在数据库中
    const baseKey = process.env.MINIPROGRAM_SIGNATURE_KEY || 'miniprogram-signature-key-2024';
    return createHmac('sha256', baseKey).update(`user_${userId}`).digest('hex');
  }
}
