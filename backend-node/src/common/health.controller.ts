import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseUtil } from './utils/response.util';

@ApiTags('系统')
@Controller()
export class HealthController {
  
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ status: 200, description: '系统正常' })
  @Get('health')
  getHealth() {
    return ResponseUtil.success({
      status: 'ok',
      message: '物流配送管理系统运行正常',
      version: '1.0.0',
    }, '系统运行正常');
  }

  @ApiOperation({ summary: '系统信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get('info')
  getInfo() {
    return ResponseUtil.success({
      name: '物流配送管理系统',
      version: '1.0.0',
      description: '基于 NestJS 的物流配送管理系统后端 API',
      author: '开发团队',
      node_version: process.version,
      uptime: process.uptime(),
    }, '获取系统信息成功');
  }
} 