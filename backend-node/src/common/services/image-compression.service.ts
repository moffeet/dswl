import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { CustomLogger } from '../../config/logger.config';

@Injectable()
export class ImageCompressionService {
  private readonly logger = new CustomLogger('ImageCompressionService');

  /**
   * 压缩图片 - 专为单据图片优化
   * 保证文字清晰度的同时减小文件大小
   */
  async compressReceiptImage(imageBuffer: Buffer, originalName: string): Promise<Buffer> {
    try {
      this.logger.log(`开始压缩图片 - 原文件: ${originalName}, 原大小: ${(imageBuffer.length / 1024).toFixed(2)}KB`);

      // 获取原图信息
      const metadata = await sharp(imageBuffer).metadata();
      this.logger.log(`原图信息 - 尺寸: ${metadata.width}x${metadata.height}, 格式: ${metadata.format}`);

      // 压缩配置 - 针对单据图片优化
      let sharpInstance = sharp(imageBuffer);

      // 1. 尺寸压缩：如果图片过大则缩放
      const maxWidth = 1920;  // 最大宽度
      const maxHeight = 1920; // 最大高度
      
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',        // 保持比例，图片完全包含在指定尺寸内
          withoutEnlargement: true  // 不放大小图片
        });
        this.logger.log(`图片尺寸过大，将缩放到 ${maxWidth}x${maxHeight} 以内`);
      }

      // 2. 转换为JPEG格式并压缩
      const compressedBuffer = await sharpInstance
        .jpeg({
          quality: 85,          // 质量85%，保证文字清晰
          progressive: true,    // 渐进式JPEG，提升加载体验
          mozjpeg: true        // 使用mozjpeg编码器，更好的压缩效果
        })
        .toBuffer();

      const originalSizeKB = (imageBuffer.length / 1024).toFixed(2);
      const compressedSizeKB = (compressedBuffer.length / 1024).toFixed(2);
      const compressionRatio = ((1 - compressedBuffer.length / imageBuffer.length) * 100).toFixed(1);

      this.logger.log(`图片压缩完成 - 原大小: ${originalSizeKB}KB, 压缩后: ${compressedSizeKB}KB, 压缩率: ${compressionRatio}%`);

      return compressedBuffer;
    } catch (error) {
      this.logger.error(`图片压缩失败 - 文件: ${originalName}, 错误: ${error.message}`, error.stack);
      
      // 压缩失败时返回原图片
      this.logger.warn(`压缩失败，使用原图片 - ${originalName}`);
      return imageBuffer;
    }
  }

  /**
   * 压缩普通图片 - 通用压缩
   */
  async compressImage(imageBuffer: Buffer, originalName: string, options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }): Promise<Buffer> {
    try {
      const { maxWidth = 1200, maxHeight = 1200, quality = 80 } = options || {};
      
      this.logger.log(`开始压缩普通图片 - 原文件: ${originalName}, 原大小: ${(imageBuffer.length / 1024).toFixed(2)}KB`);

      const metadata = await sharp(imageBuffer).metadata();
      let sharpInstance = sharp(imageBuffer);

      // 尺寸压缩
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // 格式转换和质量压缩
      const compressedBuffer = await sharpInstance
        .jpeg({
          quality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();

      const originalSizeKB = (imageBuffer.length / 1024).toFixed(2);
      const compressedSizeKB = (compressedBuffer.length / 1024).toFixed(2);
      const compressionRatio = ((1 - compressedBuffer.length / imageBuffer.length) * 100).toFixed(1);

      this.logger.log(`普通图片压缩完成 - 原大小: ${originalSizeKB}KB, 压缩后: ${compressedSizeKB}KB, 压缩率: ${compressionRatio}%`);

      return compressedBuffer;
    } catch (error) {
      this.logger.error(`普通图片压缩失败 - 文件: ${originalName}, 错误: ${error.message}`, error.stack);
      return imageBuffer;
    }
  }

  /**
   * 检查是否需要压缩
   */
  shouldCompress(fileSize: number, threshold: number = 500 * 1024): boolean {
    return fileSize > threshold; // 默认超过500KB就压缩
  }

  /**
   * 获取图片信息
   */
  async getImageInfo(imageBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: imageBuffer.length
      };
    } catch (error) {
      this.logger.error(`获取图片信息失败: ${error.message}`);
      return {
        width: 0,
        height: 0,
        format: 'unknown',
        size: imageBuffer.length
      };
    }
  }
}
