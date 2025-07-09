import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CustomLogger } from './logger.config';

/**
 * 文件上传配置
 * 支持跨平台部署，通过环境变量配置存储路径
 */
export class UploadConfig {
  private static readonly logger = new CustomLogger('UploadConfig');
  /**
   * 获取上传根目录
   * 优先级：环境变量 UPLOAD_ROOT_PATH > 默认路径
   */
  static getUploadRootPath(): string {
    // 从环境变量获取自定义路径
    if (process.env.UPLOAD_ROOT_PATH) {
      return process.env.UPLOAD_ROOT_PATH;
    }

    // 默认路径：根据操作系统和权限选择合适的路径
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      // Windows系统：使用项目所在盘符的根目录
      const projectPath = process.cwd();
      const driveLetter = projectPath.split(':')[0]; // 获取盘符，如 C
      return join(`${driveLetter}:`, 'receipts', 'uploads');
    } else {
      // Linux/macOS系统：优先尝试根目录，失败则使用用户目录
      const rootPath = join('/', 'receipts', 'uploads');
      const userPath = join(process.env.HOME || '/tmp', 'receipts', 'uploads');

      try {
        // 尝试在根目录创建
        if (!existsSync(rootPath)) {
          mkdirSync(rootPath, { recursive: true });
        }
        return rootPath;
      } catch (error) {
        // 根目录创建失败，使用用户目录
        this.logger.warn(`无法在根目录创建上传目录，使用用户目录: ${userPath}`);
        return userPath;
      }
    }
  }

  /**
   * 获取签收单上传目录
   * 按年/月/日分层存储
   */
  static getReceiptUploadDir(): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return join(this.getUploadRootPath(), 'receipts', year, month, day);
  }

  /**
   * 确保目录存在，带权限检测和自动降级
   */
  static ensureDirectoryExists(dirPath: string): string {
    try {
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }

      // 测试写权限
      const testFile = join(dirPath, '.write-test');
      require('fs').writeFileSync(testFile, 'test');
      require('fs').unlinkSync(testFile);

      return dirPath;
    } catch (error) {
      this.logger.warn(`目录创建或写入失败: ${dirPath}, 错误: ${error.message}`);

      // 如果是根目录失败，尝试用户目录
      if (dirPath.startsWith('/receipts') || dirPath.startsWith('\\receipts')) {
        const fallbackPath = join(process.env.HOME || '/tmp', 'receipts', 'uploads');
        this.logger.log(`尝试备用路径: ${fallbackPath}`);

        try {
          if (!existsSync(fallbackPath)) {
            mkdirSync(fallbackPath, { recursive: true });
          }

          // 再次测试写权限
          const testFile = join(fallbackPath, '.write-test');
          require('fs').writeFileSync(testFile, 'test');
          require('fs').unlinkSync(testFile);

          return fallbackPath;
        } catch (fallbackError) {
          this.logger.error(`备用路径也失败: ${fallbackError.message}`);
          throw new Error(`无法创建上传目录，请检查权限或设置 UPLOAD_ROOT_PATH 环境变量`);
        }
      }

      throw error;
    }
  }

  /**
   * 生成唯一文件名
   */
  static generateUniqueFileName(originalName: string, prefix: string = 'file'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const ext = originalName.split('.').pop();
    return `${prefix}_${timestamp}_${random}.${ext}`;
  }

  /**
   * 获取文件的相对路径（用于数据库存储）
   */
  static getRelativePath(fullPath: string): string {
    const rootPath = this.getUploadRootPath();
    return fullPath.replace(rootPath, '').replace(/^[\/\\]/, '');
  }

  /**
   * 根据相对路径获取完整路径
   */
  static getFullPath(relativePath: string): string {
    return join(this.getUploadRootPath(), relativePath);
  }

  /**
   * 获取访问URL路径
   */
  static getUrlPath(relativePath: string): string {
    return `/receipts/uploads/${relativePath.replace(/\\/g, '/')}`;
  }
}
