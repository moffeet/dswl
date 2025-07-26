import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { WxUsersService } from './wx-users.service';
import { CreateWxUserDto } from './dto/create-wx-user.dto';
import { UpdateWxUserDto } from './dto/update-wx-user.dto';
import { WxUserQueryDto } from './dto/wx-user-query.dto';

import { RESPONSE_CODES, HTTP_STATUS_CODES } from '../common/constants/response-codes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChineseTime, RelativeTime } from '../common/decorators/format-time.decorator';
import { ResponseUtil } from '../common/utils/response.util';

@ApiTags('📱 小程序用户管理')
@Controller('wx-users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WxUsersController {
  constructor(
    private readonly wxUsersService: WxUsersService,
  ) {}



  @Post()
  @ChineseTime() // 创建小程序用户时间格式化
  @ApiOperation({
    summary: '创建小程序用户',
    description: '创建新的小程序用户，手机号必须唯一。角色只能是司机或销售。'
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '创建成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '创建成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: '张三' },
            phone: { type: 'string', example: '13800138001' },
            role: { type: 'string', example: '司机' },
            wechatId: { type: 'string', example: 'wx_zhangsan' },
            macAddress: { type: 'string', example: '00:11:22:33:44:55' },
            createTime: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updateTime: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '请求参数错误' })
  @ApiResponse({ status: HTTP_STATUS_CODES.CONFLICT, description: '手机号已存在' })
  async create(@Body() createWxUserDto: CreateWxUserDto) {
    const wxUser = await this.wxUsersService.create(createWxUserDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '创建成功',
      data: wxUser
    };
  }

  @Get()
  @ChineseTime() // 小程序用户列表时间格式化
  @ApiOperation({
    summary: '获取小程序用户列表',
    description: '分页查询小程序用户列表，支持按姓名、手机号、角色、微信ID进行筛选。'
  })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'name', required: false, description: '姓名搜索', example: '张三' })
  @ApiQuery({ name: 'phone', required: false, description: '手机号搜索', example: '138' })
  @ApiQuery({ name: 'role', required: false, description: '角色筛选', example: '司机' })
  @ApiQuery({ name: 'wechatId', required: false, description: '微信ID搜索', example: 'wx_' })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: '张三' },
                  phone: { type: 'string', example: '13800138001' },
                  role: { type: 'string', example: '司机' },
                  wechatId: { type: 'string', example: 'wx_zhangsan' },
                  macAddress: { type: 'string', example: '00:11:22:33:44:55' },
                  createTime: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
                  updateTime: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
                }
              }
            },
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 }
          }
        }
      }
    }
  })
  async findAll(@Query() queryDto: WxUserQueryDto) {
    const { wxUsers, total } = await this.wxUsersService.findAll(queryDto);
    return ResponseUtil.page(
      wxUsers,
      total,
      queryDto.page || 1,
      queryDto.limit || 10,
      '获取成功'
    );
  }

  @Get(':id')
  @ChineseTime() // 小程序用户详情时间格式化
  @ApiOperation({ summary: '获取小程序用户详情' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '获取成功' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const wxUser = await this.wxUsersService.findOne(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: wxUser
    };
  }

  @Patch(':id')
  @ChineseTime() // 更新小程序用户时间格式化
  @ApiOperation({ summary: '更新小程序用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '更新成功' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  @ApiResponse({ status: HTTP_STATUS_CODES.CONFLICT, description: '手机号已存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWxUserDto: UpdateWxUserDto,
  ) {
    const wxUser = await this.wxUsersService.update(id, updateWxUserDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '更新成功',
      data: wxUser
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除小程序用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '删除成功' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.wxUsersService.remove(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '删除成功'
    };
  }

  @Post(':id/reset-device')
  @ApiOperation({
    summary: '重置用户设备绑定',
    description: `
🔄 **重置小程序用户设备绑定**

## 📋 功能说明
- 管理员可以重置用户的设备绑定信息
- 用于解决用户换手机无法登录的问题
- 重置后用户需要重新登录进行设备绑定

## 🎯 使用场景
- 用户更换了手机设备
- 用户设备丢失或损坏
- 设备标识发生变化
- 用户无法正常登录小程序

## ⚠️ 注意事项
- 重置后用户当前的登录状态会失效
- 用户需要重新登录才能使用小程序
- 建议在重置前通知用户
    `
  })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '重置成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '设备绑定重置成功，用户需要重新登录' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'number', example: 1 },
            userName: { type: 'string', example: '张三' },
            phone: { type: 'string', example: '138****8001' },
            resetTime: { type: 'string', example: '2024-01-15 14:30:25' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  async resetDeviceBinding(@Param('id', ParseIntPipe) id: number) {
    const result = await this.wxUsersService.resetDeviceBinding(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '设备绑定重置成功，用户需要重新登录',
      data: result
    };
  }
}
