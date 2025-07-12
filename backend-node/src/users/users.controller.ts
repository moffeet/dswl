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
  ApiBody
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from '../common/dto/pagination.dto';
import { RESPONSE_CODES, HTTP_STATUS_CODES } from '../common/constants/response-codes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseUtil } from '../common/utils/response.util';
import { ChineseTime, RelativeTime } from '../common/decorators/format-time.decorator';

@ApiTags('👤 用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ChineseTime() // 创建用户时间格式化
  @ApiOperation({
    summary: '创建用户',
    description: '创建新的系统用户，用户创建后可以分配角色获得相应权限。密码会自动加密存储，返回数据不包含密码字段。'
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '用户创建成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '创建成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'admin' },
            nickname: { type: 'string', example: '管理员' },
            gender: { type: 'string', example: 'male' },
            phone: { type: 'string', example: '13800138000' },
            email: { type: 'string', example: 'admin@example.com' },
            status: { type: 'string', example: 'normal' },
            createTime: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
            updateTime: { type: 'string', example: '2024-01-20T10:30:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '请求参数错误' })
  @ApiResponse({ status: HTTP_STATUS_CODES.CONFLICT, description: '用户名已存在' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // 移除密码字段
    const { password, ...result } = user;
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '创建成功',
      data: result
    };
  }

  @Get()
  @ChineseTime() // 用户列表时间格式化
  @ApiOperation({
    summary: '获取用户列表',
    description: '分页查询用户列表，支持按用户名、昵称进行筛选。返回数据不包含密码字段。'
  })
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
                  username: { type: 'string', example: 'admin' },
                  nickname: { type: 'string', example: '管理员' },
                  isFirstLogin: { type: 'number', example: 0 },
                  lastLoginTime: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
                  createTime: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
                  updateTime: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
                  roles: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', example: 1 },
                        roleName: { type: 'string', example: '超级管理员' }
                      }
                    }
                  }
                }
              }
            },
            total: { type: 'number', example: 50 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 }
          }
        }
      }
    }
  })
  async findAll(@Query() searchDto: UserQueryDto) {
    const { users, total } = await this.usersService.findAll(searchDto);
    // 移除密码字段
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    return ResponseUtil.page(
      safeUsers,
      total,
      searchDto.page || 1,
      searchDto.limit || 10,
      '获取成功'
    );
  }

  @Get(':id')
  @ChineseTime() // 用户详情时间格式化
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '获取成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    // 移除密码字段
    const { password, ...result } = user;
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: result
    };
  }

  @Patch(':id')
  @ChineseTime() // 更新用户时间格式化
  @ApiOperation({ summary: '更新用户' })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '更新成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    // 移除密码字段
    const { password, ...result } = user;
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '更新成功',
      data: result
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '删除成功'
    };
  }

  @Delete()
  @ApiOperation({
    summary: '批量删除用户',
    description: '批量删除多个用户，支持传入用户ID数组'
  })
  @ApiBody({
    description: '用户ID数组',
    schema: {
      type: 'object',
      required: ['ids'],
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          description: '要删除的用户ID数组',
          example: [1, 2, 3]
        }
      }
    }
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '批量删除成功' })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '请求参数错误' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '部分用户不存在' })
  async removeMultiple(@Body() body: { ids: number[] }) {
    await this.usersService.removeMultiple(body.ids);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '批量删除成功'
    };
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: '重置用户密码' })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '重置成功' })
  async resetPassword(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.resetPassword(id);
    // 移除密码字段
    const { password, ...result } = user;
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '密码重置成功，已重置为用户名',
      data: result
    };
  }
}