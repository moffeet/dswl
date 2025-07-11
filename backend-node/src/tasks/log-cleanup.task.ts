import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomLogger } from '../config/logger.config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 日志清理定时任务
 * 定期清理过期的日志文件，保持磁盘空间
 */
@Injectable()
export class LogCleanupTask {
  private readonly logger = new CustomLogger('LogCleanupTask');
  private readonly logsDir = path.join(process.cwd(), '..', 'logs');

  /**
   * 每天凌晨3点执行日志清理
   * 保留最近90天的日志文件
   */
  @Cron('0 3 * * *') // 每天凌晨3点
  async cleanupOldLogs() {
    try {
      this.logger.log('开始执行日志清理任务');

      if (!fs.existsSync(this.logsDir)) {
        this.logger.warn(`日志目录不存在: ${this.logsDir}`);
        return;
      }

      const files = fs.readdirSync(this.logsDir);
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      let deletedCount = 0;
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);

        // 跳过目录和非日志文件
        if (stats.isDirectory() || !this.isLogFile(file)) {
          continue;
        }

        // 跳过当前正在使用的日志文件（不带日期的文件名）
        if (this.isCurrentLogFile(file)) {
          continue;
        }

        // 检查文件是否超过90天
        if (stats.mtime < ninetyDaysAgo) {
          try {
            totalSize += stats.size;
            fs.unlinkSync(filePath);
            deletedCount++;
            this.logger.log(`删除过期日志文件: ${file} (${this.formatFileSize(stats.size)})`);
          } catch (error) {
            this.logger.error(`删除日志文件失败: ${file}`, error.message);
          }
        }
      }

      if (deletedCount > 0) {
        this.logger.log(`日志清理完成: 删除 ${deletedCount} 个文件，释放空间 ${this.formatFileSize(totalSize)}`);
      } else {
        this.logger.log('日志清理完成: 没有需要删除的过期文件');
      }

      // 记录当前日志目录状态
      await this.logDirectoryStatus();

    } catch (error) {
      this.logger.error('日志清理任务执行失败', error.message);
    }
  }

  /**
   * 每天凌晨1点检查日志目录状态
   */
  @Cron('0 1 * * *') // 每天凌晨1点
  async checkLogDirectoryStatus() {
    try {
      await this.logDirectoryStatus();
    } catch (error) {
      this.logger.error('检查日志目录状态失败', error.message);
    }
  }

  /**
   * 记录日志目录状态
   */
  private async logDirectoryStatus() {
    if (!fs.existsSync(this.logsDir)) {
      this.logger.warn(`日志目录不存在: ${this.logsDir}`);
      return;
    }

    const files = fs.readdirSync(this.logsDir);
    let totalSize = 0;
    let fileCount = 0;

    for (const file of files) {
      const filePath = path.join(this.logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && this.isLogFile(file)) {
        totalSize += stats.size;
        fileCount++;
      }
    }

    this.logger.log(`日志目录状态: ${fileCount} 个日志文件，总大小 ${this.formatFileSize(totalSize)}`);
  }

  /**
   * 判断是否为当前正在使用的日志文件（不带日期的文件名）
   */
  private isCurrentLogFile(filename: string): boolean {
    const currentLogFiles = [
      'backend.log',
      'error.log',
      'database.log',
      'security.log'
    ];
    return currentLogFiles.includes(filename);
  }

  /**
   * 判断是否为日志文件
   */
  private isLogFile(filename: string): boolean {
    const logExtensions = ['.log', '.gz'];
    const logPatterns = [
      /^backend.*\.log$/,           // backend.log, backend-2025-01-09.log
      /^error.*\.log$/,             // error.log, error-2025-01-09.log
      /^database.*\.log$/,          // database.log, database-2025-01-09.log
      /^security.*\.log$/,          // security.log, security-2025-01-09.log
      /.*\.log\.gz$/,               // 压缩的日志文件
      /.*-\d{4}-\d{2}-\d{2}\.log$/ // 带日期的归档日志文件
    ];

    return logExtensions.some(ext => filename.endsWith(ext)) ||
           logPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
