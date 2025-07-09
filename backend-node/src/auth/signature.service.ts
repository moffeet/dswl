import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { CustomLogger } from '../config/logger.config';

export interface SignatureParams {
  timestamp: string;
  nonce: string;
  signature: string;
  [key: string]: any;
}

export interface SignatureValidationResult {
  isValid: boolean;
  error?: string;
}

@Injectable()
export class SignatureService {
  private readonly logger = new CustomLogger('SignatureService');
  
  // 签名有效期：5分钟
  private readonly SIGNATURE_EXPIRE_TIME = 5 * 60 * 1000;
  
  // 用于存储已使用的nonce，防止重放攻击
  private readonly usedNonces = new Map<string, number>();
  
  // 定期清理过期的nonce（每10分钟清理一次）
  constructor() {
    setInterval(() => {
      this.cleanExpiredNonces();
    }, 10 * 60 * 1000);
  }

  /**
   * 生成签名
   * @param params 请求参数
   * @param secretKey 签名密钥
   * @returns 签名字符串
   */
  generateSignature(params: Record<string, any>, secretKey: string): string {
    try {
      // 1. 过滤掉signature参数本身
      const filteredParams = { ...params };
      delete filteredParams.signature;

      // 2. 按参数名字典序排序
      const sortedKeys = Object.keys(filteredParams).sort();
      
      // 3. 拼接参数字符串
      const paramString = sortedKeys
        .map(key => {
          const value = filteredParams[key];
          // 处理不同类型的值
          if (value === null || value === undefined) {
            return `${key}=`;
          }
          if (typeof value === 'object') {
            return `${key}=${JSON.stringify(value)}`;
          }
          return `${key}=${value}`;
        })
        .join('&');

      this.logger.log(`生成签名参数字符串: ${paramString}`);

      // 4. 使用HMAC-SHA256生成签名
      const signature = createHmac('sha256', secretKey)
        .update(paramString)
        .digest('hex');

      this.logger.log(`生成签名成功: ${signature.substring(0, 8)}...`);
      
      return signature;
    } catch (error) {
      this.logger.error(`生成签名失败: ${error.message}`, error.stack);
      throw new BadRequestException('签名生成失败');
    }
  }

  /**
   * 验证签名
   * @param params 请求参数（包含签名）
   * @param secretKey 签名密钥
   * @returns 验证结果
   */
  validateSignature(params: SignatureParams, secretKey: string): SignatureValidationResult {
    try {
      // 1. 检查必需参数
      if (!params.timestamp || !params.nonce || !params.signature) {
        return {
          isValid: false,
          error: '缺少必需的签名参数：timestamp、nonce、signature'
        };
      }

      // 2. 验证时间戳
      const timestampValidation = this.validateTimestamp(params.timestamp);
      if (!timestampValidation.isValid) {
        return timestampValidation;
      }

      // 3. 验证nonce（防重放）
      const nonceValidation = this.validateNonce(params.nonce, params.timestamp);
      if (!nonceValidation.isValid) {
        return nonceValidation;
      }

      // 4. 生成期望的签名
      const expectedSignature = this.generateSignature(params, secretKey);

      // 5. 比较签名
      if (params.signature !== expectedSignature) {
        this.logger.warn(`签名验证失败 - 期望: ${expectedSignature.substring(0, 8)}..., 实际: ${params.signature.substring(0, 8)}...`);
        return {
          isValid: false,
          error: '签名验证失败'
        };
      }

      // 6. 记录已使用的nonce
      this.markNonceAsUsed(params.nonce, params.timestamp);

      this.logger.log(`签名验证成功 - nonce: ${params.nonce}`);
      
      return {
        isValid: true
      };
    } catch (error) {
      this.logger.error(`签名验证异常: ${error.message}`, error.stack);
      return {
        isValid: false,
        error: '签名验证异常'
      };
    }
  }

  /**
   * 验证时间戳
   * @param timestamp 时间戳字符串
   * @returns 验证结果
   */
  private validateTimestamp(timestamp: string): SignatureValidationResult {
    try {
      const timestampNum = parseInt(timestamp, 10);
      
      if (isNaN(timestampNum)) {
        return {
          isValid: false,
          error: '时间戳格式无效'
        };
      }

      const now = Date.now();
      const timeDiff = Math.abs(now - timestampNum);

      if (timeDiff > this.SIGNATURE_EXPIRE_TIME) {
        return {
          isValid: false,
          error: `请求已过期，时间差: ${Math.round(timeDiff / 1000)}秒`
        };
      }

      return {
        isValid: true
      };
    } catch (error) {
      return {
        isValid: false,
        error: '时间戳验证异常'
      };
    }
  }

  /**
   * 验证nonce（防重放攻击）
   * @param nonce 随机数
   * @param timestamp 时间戳
   * @returns 验证结果
   */
  private validateNonce(nonce: string, timestamp: string): SignatureValidationResult {
    try {
      if (!nonce || nonce.length < 8) {
        return {
          isValid: false,
          error: 'nonce长度不能少于8位'
        };
      }

      // 检查nonce是否已被使用
      if (this.usedNonces.has(nonce)) {
        return {
          isValid: false,
          error: '请求重复，nonce已被使用'
        };
      }

      return {
        isValid: true
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'nonce验证异常'
      };
    }
  }

  /**
   * 标记nonce为已使用
   * @param nonce 随机数
   * @param timestamp 时间戳
   */
  private markNonceAsUsed(nonce: string, timestamp: string): void {
    const timestampNum = parseInt(timestamp, 10);
    this.usedNonces.set(nonce, timestampNum);
  }

  /**
   * 清理过期的nonce
   */
  private cleanExpiredNonces(): void {
    const now = Date.now();
    const expiredNonces: string[] = [];

    for (const [nonce, timestamp] of this.usedNonces.entries()) {
      if (now - timestamp > this.SIGNATURE_EXPIRE_TIME) {
        expiredNonces.push(nonce);
      }
    }

    expiredNonces.forEach(nonce => {
      this.usedNonces.delete(nonce);
    });

    if (expiredNonces.length > 0) {
      this.logger.log(`清理过期nonce: ${expiredNonces.length}个`);
    }
  }

  /**
   * 获取用户的签名密钥
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

  /**
   * 生成随机nonce
   * @param length nonce长度，默认16位
   * @returns 随机nonce字符串
   */
  generateNonce(length: number = 16): string {
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
}
