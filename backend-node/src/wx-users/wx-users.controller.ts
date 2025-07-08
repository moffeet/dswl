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
import { RESPONSE_CODES } from '../common/constants/response-codes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('📱 小程序用户管理')
@Controller('wx-users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WxUsersController {
  constructor(private readonly wxUsersService: WxUsersService) {}

  @Post()
  @ApiOperation({
    summary: '创建小程序用户',
    description: '创建新的小程序用户，手机号必须唯一。角色只能是司机或销售。'
  })
  @ApiResponse({
    status: 201,
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
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '手机号已存在' })
  async create(@Body() createWxUserDto: CreateWxUserDto) {
    const wxUser = await this.wxUsersService.create(createWxUserDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '创建成功',
      data: wxUser
    };
  }

  @Get()
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
    status: 200,
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
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: {
        list: wxUsers,
        total,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取小程序用户详情' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const wxUser = await this.wxUsersService.findOne(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: wxUser
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新小程序用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiResponse({ status: 409, description: '手机号已存在' })
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
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.wxUsersService.remove(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '删除成功'
    };
  }
}
