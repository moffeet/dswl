import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ReceiptsService } from '../receipts/receipts.service';

import { CustomLogger } from '../config/logger.config';

@Injectable()
export class TasksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new CustomLogger('TasksService');
  private intervals: NodeJS.Timeout[] = [];

  constructor(
    private readonly receiptsService: ReceiptsService,
  ) {}

  /**
   * 模块初始化时启动所有定时任务
   */
  onModuleInit() {
    this.logger.log('🚀 初始化定时任务服务');
    this.startAllTasks();
  }

  /**
   * 模块销毁时停止所有定时任务
   */
  onModuleDestroy() {
    this.logger.log('🛑 停止所有定时任务');
    this.stopAllTasks();
  }

  /**
   * 启动所有定时任务
   */
  private startAllTasks() {
    // 每周日凌晨2点执行数据清理（签收单和打卡记录）
    const weeklyCleanupInterval = setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const dayOfWeek = now.getDay(); // 0 = 周日, 1 = 周一, ..., 6 = 周六

      // 每周日凌晨2点执行清理任务
      if (dayOfWeek === 0 && hour === 2 && minute === 0) {
        this.logger.log('🕐 开始执行每周签收单清理任务');

        // 清理3个月前的签收单
        await this.handleCleanupOldReceipts();

        this.logger.log('✅ 每周签收单清理任务完成');
      }
    }, 60000); // 每分钟检查一次

    // 保存定时器引用
    this.intervals.push(weeklyCleanupInterval);

    this.logger.log('✅ 定时任务已启动');
    this.logger.log('📋 任务配置:');
    this.logger.log('  - 签收单清理: 每周日凌晨2点执行');
    this.logger.log('  - 清理内容: 3个月前的签收单数据和图片文件');
  }

  /**
   * 停止所有定时任务
   */
  private stopAllTasks() {
    this.intervals.forEach(interval => {
      if (interval) {
        clearInterval(interval);
      }
    });
    this.intervals = [];
  }

  /**
   * 清理3个月前的签收单
   */
  async handleCleanupOldReceipts() {
    this.logger.log('🕐 定时任务开始：清理3个月前的签收单');

    try {
      const result = await this.receiptsService.cleanupOldReceipts();

      if (result.deletedCount > 0) {
        this.logger.log(`✅ 签收单清理完成 - 删除数量: ${result.deletedCount}`);
      } else {
        this.logger.log('ℹ️ 没有需要清理的签收单');
      }
    } catch (error) {
      this.logger.error(`❌ 签收单清理失败: ${error.message}`, error.stack);
    }
  }





  /**
   * 手动触发签收单清理（用于测试）
   */
  async manualCleanupReceipts(): Promise<{ deletedCount: number }> {
    this.logger.log('🔧 手动触发签收单清理');
    return await this.receiptsService.cleanupOldReceipts();
  }



  /**
   * 获取定时任务状态
   */
  getTasksStatus(): any {
    return {
      tasks: [
        {
          name: 'weekly-cleanup-receipts',
          description: '每周清理3个月前的签收单',
          schedule: '每周日凌晨2点执行',
          cron: '0 2 * * 0',
          timeZone: 'Asia/Shanghai',
          status: this.intervals.length > 0 ? 'running' : 'stopped'
        }
      ],
      totalTasks: 1,
      runningTasks: this.intervals.length,
      timezone: 'Asia/Shanghai',
      currentTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    };
  }
}
