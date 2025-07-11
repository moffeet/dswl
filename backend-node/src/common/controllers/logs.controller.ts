import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CustomLogger } from '../../config/logger.config';
import { ResponseUtil } from '../utils/response.util';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 日志管理控制器
 * 提供日志查看和管理功能
 */
@ApiTags('日志管理')
@Controller('api/logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LogsController {
  private readonly logger = new CustomLogger('LogsController');
  private readonly logsDir = path.join(process.cwd(), '..', 'logs');

  /**
   * 获取日志目录状态
   */
  @Get('status')
  @ApiOperation({ summary: '获取日志目录状态' })
  async getLogStatus() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return ResponseUtil.error('日志目录不存在');
      }

      const files = fs.readdirSync(this.logsDir);
      const logFiles = [];
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && this.isLogFile(file)) {
          logFiles.push({
            name: file,
            size: stats.size,
            sizeFormatted: this.formatFileSize(stats.size),
            modified: stats.mtime,
            created: stats.birthtime
          });
          totalSize += stats.size;
        }
      }

      // 按修改时间倒序排列
      logFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

      return ResponseUtil.success({
        directory: this.logsDir,
        totalFiles: logFiles.length,
        totalSize: totalSize,
        totalSizeFormatted: this.formatFileSize(totalSize),
        files: logFiles
      }, '获取日志状态成功');

    } catch (error) {
      this.logger.error('获取日志状态失败', error.message);
      return ResponseUtil.error('获取日志状态失败');
    }
  }

  /**
   * 获取日志文件内容（最后N行）
   */
  @Get('content')
  @ApiOperation({ summary: '获取日志文件内容' })
  @ApiQuery({ name: 'file', description: '日志文件名', required: true })
  @ApiQuery({ name: 'lines', description: '显示行数', required: false, type: Number })
  async getLogContent(
    @Query('file') fileName: string,
    @Query('lines') lines: number = 100
  ) {
    try {
      if (!fileName || !this.isLogFile(fileName)) {
        return ResponseUtil.error('无效的日志文件名');
      }

      const filePath = path.join(this.logsDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        return ResponseUtil.error('日志文件不存在');
      }

      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const allLines = content.split('\n');
      
      // 获取最后N行（排除空行）
      const nonEmptyLines = allLines.filter(line => line.trim() !== '');
      const lastLines = nonEmptyLines.slice(-Math.abs(lines));

      return ResponseUtil.success({
        fileName: fileName,
        fileSize: stats.size,
        fileSizeFormatted: this.formatFileSize(stats.size),
        totalLines: nonEmptyLines.length,
        displayLines: lastLines.length,
        content: lastLines.join('\n'),
        lastModified: stats.mtime
      }, '获取日志内容成功');

    } catch (error) {
      this.logger.error('获取日志内容失败', error.message);
      return ResponseUtil.error('获取日志内容失败');
    }
  }

  /**
   * 搜索日志内容
   */
  @Get('search')
  @ApiOperation({ summary: '搜索日志内容' })
  @ApiQuery({ name: 'file', description: '日志文件名', required: true })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: true })
  @ApiQuery({ name: 'limit', description: '结果限制', required: false, type: Number })
  async searchLogs(
    @Query('file') fileName: string,
    @Query('keyword') keyword: string,
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!fileName || !this.isLogFile(fileName)) {
        return ResponseUtil.error('无效的日志文件名');
      }

      if (!keyword || keyword.trim() === '') {
        return ResponseUtil.error('搜索关键词不能为空');
      }

      const filePath = path.join(this.logsDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        return ResponseUtil.error('日志文件不存在');
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // 搜索包含关键词的行
      const matchedLines = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
          matchedLines.push({
            lineNumber: i + 1,
            content: lines[i]
          });
          
          if (matchedLines.length >= limit) {
            break;
          }
        }
      }

      return ResponseUtil.success({
        fileName: fileName,
        keyword: keyword,
        totalMatches: matchedLines.length,
        matches: matchedLines
      }, `搜索完成，找到 ${matchedLines.length} 条匹配记录`);

    } catch (error) {
      this.logger.error('搜索日志失败', error.message);
      return ResponseUtil.error('搜索日志失败');
    }
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
