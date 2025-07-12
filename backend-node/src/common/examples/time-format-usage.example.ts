/**
 * 时间格式化使用示例
 * 
 * 本文件展示了如何在项目中使用时间格式化功能
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ResponseUtil } from '../utils/response.util';
import { DateFormatUtil } from '../utils/date-format.util';
import { FormatTime, ChineseTime, RelativeTime } from '../decorators/format-time.decorator';

@Controller('examples/time-format')
export class TimeFormatExampleController {

  /**
   * 示例1：使用装饰器自动格式化时间为中文格式
   */
  @Get('chinese-time')
  @ChineseTime() // 使用装饰器，自动格式化时间
  @ApiOperation({ summary: '获取中文格式时间的数据' })
  @ApiResponse({
    status: 200,
    description: '成功返回中文格式时间',
    schema: {
      example: {
        code: 200,
        message: '获取成功',
        data: {
          id: 1,
          name: '示例数据',
          updatedAt: '2025-07-11 12:11:01', // 自动格式化为中文格式
          createdAt: '2025-07-11 10:30:00'
        },
        timestamp: '2025-07-11 12:11:01' // 响应时间戳也会格式化
      }
    }
  })
  async getChineseTimeData() {
    const data = {
      id: 1,
      name: '示例数据',
      updatedAt: new Date('2025-07-11T04:11:01.000Z'),
      createdAt: new Date('2025-07-11T02:30:00.000Z')
    };
    
    return ResponseUtil.success(data, '获取成功');
  }

  /**
   * 示例2：使用装饰器格式化时间为相对时间
   */
  @Get('relative-time')
  @RelativeTime() // 格式化为相对时间
  @ApiOperation({ summary: '获取相对时间格式的数据' })
  async getRelativeTimeData() {
    const data = {
      id: 2,
      name: '相对时间示例',
      updatedAt: new Date(Date.now() - 5 * 60 * 1000), // 5分钟前
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2小时前
    };
    
    return ResponseUtil.success(data, '获取成功');
  }

  /**
   * 示例3：通过请求参数控制时间格式化
   */
  @Get('flexible-time')
  @ApiOperation({ summary: '灵活的时间格式化' })
  @ApiQuery({ name: 'formatTime', required: false, description: '是否格式化时间' })
  @ApiQuery({ name: 'timeFormat', required: false, description: '时间格式类型：chinese|relative|iso' })
  async getFlexibleTimeData(@Query('formatTime') formatTime?: string) {
    const data = {
      id: 3,
      name: '灵活格式化示例',
      updatedAt: new Date(),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1天前
    };
    
    return ResponseUtil.success(data, '获取成功');
  }

  /**
   * 示例4：使用 ResponseUtil 的时间格式化方法
   */
  @Get('manual-format')
  @ApiOperation({ summary: '手动使用时间格式化工具' })
  async getManualFormatData() {
    const data = {
      id: 4,
      name: '手动格式化示例',
      updatedAt: new Date(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前
    };
    
    // 使用 ResponseUtil 的时间格式化方法
    return ResponseUtil.successWithTimeFormat(data, '获取成功', true);
  }

  /**
   * 示例5：分页数据的时间格式化
   */
  @Get('page-with-time')
  @ChineseTime()
  @ApiOperation({ summary: '分页数据时间格式化' })
  async getPageWithTimeData() {
    const data = [
      {
        id: 1,
        name: '客户1',
        updatedAt: new Date(),
        createdAt: new Date(Date.now() - 60 * 60 * 1000)
      },
      {
        id: 2,
        name: '客户2',
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];
    
    return ResponseUtil.page(data, 2, 1, 10, '获取成功');
  }

  /**
   * 示例6：直接使用 DateFormatUtil 工具类
   */
  @Get('util-examples')
  @ApiOperation({ summary: '时间格式化工具类使用示例' })
  async getUtilExamples() {
    const now = new Date();
    const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2小时前
    
    const examples = {
      原始时间: now.toISOString(),
      中文日期时间: DateFormatUtil.formatDateTime(now),
      中文日期: DateFormatUtil.formatDate(now),
      时间: DateFormatUtil.formatTime(now),
      相对时间: DateFormatUtil.formatRelativeTime(pastTime),
      自定义格式: DateFormatUtil.formatCustom(now, 'YYYY年MM月DD日 HH:mm:ss'),
      当前时间各种格式: {
        datetime: DateFormatUtil.getCurrentTime('datetime'),
        date: DateFormatUtil.getCurrentTime('date'),
        time: DateFormatUtil.getCurrentTime('time'),
        iso: DateFormatUtil.getCurrentTime('iso')
      }
    };
    
    return ResponseUtil.success(examples, '时间格式化示例');
  }
}

/**
 * 使用说明：
 * 
 * 1. 装饰器方式（推荐）：
 *    @ChineseTime() - 格式化为中文时间
 *    @RelativeTime() - 格式化为相对时间
 *    @FormatTime('chinese') - 自定义格式化类型
 * 
 * 2. 请求参数方式：
 *    GET /api/data?formatTime=true&timeFormat=chinese
 *    GET /api/data?formatTime=true&timeFormat=relative
 * 
 * 3. 请求头方式：
 *    X-Format-Time: true
 * 
 * 4. ResponseUtil 方法：
 *    ResponseUtil.successWithTimeFormat(data, message, true)
 *    ResponseUtil.pageWithTimeFormat(data, total, page, limit, message, true)
 * 
 * 5. 直接使用工具类：
 *    DateFormatUtil.formatDateTime(date)
 *    DateFormatUtil.formatRelativeTime(date)
 */
