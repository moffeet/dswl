import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomLogger } from '../config/logger.config';
import { RESPONSE_CODES, HTTP_STATUS_CODES } from '../common/constants/response-codes';

@ApiTags('🕐 定时任务管理')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  private readonly logger = new CustomLogger('TasksController');

  constructor(private readonly tasksService: TasksService) {}

  @Get('status')
  @ApiOperation({
    summary: '获取定时任务状态',
    description: '查看所有定时任务的配置和状态信息'
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '获取成功' })
  async getTasksStatus() {
    try {
      this.logger.log('获取定时任务状态');
      
      const status = this.tasksService.getTasksStatus();
      
      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '获取定时任务状态成功',
        data: status
      };
    } catch (error) {
      this.logger.error(`获取定时任务状态失败: ${error.message}`, error.stack);
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }

  @Post('manual/cleanup-receipts')
  @ApiOperation({
    summary: '手动清理签收单',
    description: '手动触发清理3个月前的签收单任务，用于测试或紧急清理'
  })
  @ApiResponse({ status: 200, description: '清理成功' })
  async manualCleanupReceipts() {
    try {
      this.logger.log('手动触发签收单清理任务');
      
      const result = await this.tasksService.manualCleanupReceipts();
      
      return {
        code: RESPONSE_CODES.SUCCESS,
        message: `手动清理签收单完成，共删除 ${result.deletedCount} 条记录`,
        data: result
      };
    } catch (error) {
      this.logger.error(`手动清理签收单失败: ${error.message}`, error.stack);
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }


}
