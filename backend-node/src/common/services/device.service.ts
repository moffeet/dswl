import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { CustomLogger } from '../../config/logger.config';

@Injectable()
export class DeviceService {
  private readonly logger = new CustomLogger('DeviceService');

  /**
   * 生成设备唯一标识
   * 基于多个设备信息生成唯一标识
   * @param deviceInfo 设备信息
   * @returns 设备唯一标识
   */
  generateDeviceId(deviceInfo: {
    macAddress?: string;
    imei?: string;
    androidId?: string;
    uuid?: string;
    brand?: string;
    model?: string;
    systemVersion?: string;
  }): string {
    this.logger.log(`🔧 生成设备唯一标识 - 设备信息: ${JSON.stringify(deviceInfo)}`);

    // 优先级：MAC地址 > IMEI > Android ID > UUID
    let primaryId = '';
    let deviceType = '';

    if (deviceInfo.macAddress && this.isValidMacAddress(deviceInfo.macAddress)) {
      primaryId = deviceInfo.macAddress;
      deviceType = 'MAC';
    } else if (deviceInfo.imei && this.isValidImei(deviceInfo.imei)) {
      primaryId = deviceInfo.imei;
      deviceType = 'IMEI';
    } else if (deviceInfo.androidId) {
      primaryId = deviceInfo.androidId;
      deviceType = 'ANDROID_ID';
    } else if (deviceInfo.uuid) {
      primaryId = deviceInfo.uuid;
      deviceType = 'UUID';
    } else {
      // 如果没有主要标识，使用设备信息组合生成
      const combinedInfo = [
        deviceInfo.brand || '',
        deviceInfo.model || '',
        deviceInfo.systemVersion || '',
        Date.now().toString() // 添加时间戳确保唯一性
      ].join('|');
      
      primaryId = this.hashString(combinedInfo);
      deviceType = 'GENERATED';
    }

    // 生成最终的设备ID：类型前缀 + 主标识的哈希值
    const deviceId = `${deviceType}_${this.hashString(primaryId)}`;
    
    this.logger.log(`✅ 设备ID生成成功 - 类型: ${deviceType}, ID: ${deviceId}`);
    return deviceId;
  }

  /**
   * 验证设备ID格式
   * @param deviceId 设备ID
   * @returns 是否有效
   */
  isValidDeviceId(deviceId: string): boolean {
    if (!deviceId || typeof deviceId !== 'string') {
      return false;
    }

    // 检查格式：类型_哈希值
    const pattern = /^(MAC|IMEI|ANDROID_ID|UUID|GENERATED)_[a-f0-9]{64}$/;
    return pattern.test(deviceId);
  }

  /**
   * 从设备ID中提取设备类型
   * @param deviceId 设备ID
   * @returns 设备类型
   */
  getDeviceType(deviceId: string): string | null {
    if (!this.isValidDeviceId(deviceId)) {
      return null;
    }

    return deviceId.split('_')[0];
  }

  /**
   * 验证MAC地址格式
   * @param macAddress MAC地址
   * @returns 是否有效
   */
  private isValidMacAddress(macAddress: string): boolean {
    if (!macAddress) return false;
    
    // 支持多种MAC地址格式
    const patterns = [
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, // XX:XX:XX:XX:XX:XX 或 XX-XX-XX-XX-XX-XX
      /^([0-9A-Fa-f]{2}\.){5}([0-9A-Fa-f]{2})$/, // XX.XX.XX.XX.XX.XX
      /^[0-9A-Fa-f]{12}$/ // XXXXXXXXXXXX
    ];

    return patterns.some(pattern => pattern.test(macAddress));
  }

  /**
   * 验证IMEI格式
   * @param imei IMEI号
   * @returns 是否有效
   */
  private isValidImei(imei: string): boolean {
    if (!imei || typeof imei !== 'string') return false;
    
    // IMEI应该是15位数字
    return /^\d{15}$/.test(imei);
  }

  /**
   * 生成字符串的SHA256哈希值
   * @param input 输入字符串
   * @returns 哈希值
   */
  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * 标准化MAC地址格式
   * @param macAddress 原始MAC地址
   * @returns 标准化后的MAC地址（大写，冒号分隔）
   */
  normalizeMacAddress(macAddress: string): string {
    if (!macAddress) return '';

    // 移除所有分隔符
    const cleanMac = macAddress.replace(/[:.\-]/g, '').toUpperCase();
    
    // 如果长度不是12，返回原值
    if (cleanMac.length !== 12) return macAddress;

    // 格式化为 XX:XX:XX:XX:XX:XX
    return cleanMac.match(/.{2}/g)?.join(':') || macAddress;
  }

  /**
   * 生成设备指纹
   * 基于多个设备特征生成更稳定的设备指纹
   * @param deviceInfo 设备信息
   * @returns 设备指纹
   */
  generateDeviceFingerprint(deviceInfo: {
    macAddress?: string;
    imei?: string;
    androidId?: string;
    uuid?: string;
    brand?: string;
    model?: string;
    systemVersion?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
  }): string {
    // 收集所有可用的设备特征
    const features = [
      deviceInfo.macAddress ? this.normalizeMacAddress(deviceInfo.macAddress) : '',
      deviceInfo.imei || '',
      deviceInfo.androidId || '',
      deviceInfo.uuid || '',
      deviceInfo.brand || '',
      deviceInfo.model || '',
      deviceInfo.systemVersion || '',
      deviceInfo.screenResolution || '',
      deviceInfo.timezone || '',
      deviceInfo.language || ''
    ].filter(feature => feature.length > 0);

    // 生成指纹
    const fingerprint = this.hashString(features.join('|'));
    
    this.logger.log(`🔍 设备指纹生成 - 特征数量: ${features.length}, 指纹: ${fingerprint.substring(0, 16)}...`);
    
    return `FINGERPRINT_${fingerprint}`;
  }

  /**
   * 比较两个设备ID的相似度
   * @param deviceId1 设备ID1
   * @param deviceId2 设备ID2
   * @returns 相似度分数 (0-1)
   */
  calculateDeviceSimilarity(deviceId1: string, deviceId2: string): number {
    if (!deviceId1 || !deviceId2) return 0;
    if (deviceId1 === deviceId2) return 1;

    // 如果设备类型相同，相似度更高
    const type1 = this.getDeviceType(deviceId1);
    const type2 = this.getDeviceType(deviceId2);
    
    if (type1 === type2 && type1) {
      return 0.5; // 同类型设备有基础相似度
    }

    return 0; // 不同类型设备相似度为0
  }
}
