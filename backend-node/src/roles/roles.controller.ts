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
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { RolesService, CreateRoleDto, UpdateRoleDto } from './roles.service';
import { RoleQueryDto } from '../common/dto/pagination.dto';
import { RESPONSE_CODES, RESPONSE_MESSAGES, HTTP_STATUS_CODES } from '../common/constants/response-codes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseUtil } from '../common/utils/response.util';

@ApiTags('👥 角色管理')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ 
    summary: '创建角色',
    description: '创建新的系统角色，角色创建后可以为其分配菜单权限和按钮权限，用户绑定角色后即可获得对应的权限。'
  })
  @ApiBody({
    description: '角色创建数据',
    schema: {
      type: 'object',
      required: ['roleName', 'roleCode'],
      properties: {
        roleName: {
          type: 'string',
          description: '角色名称（必填，唯一）',
          example: '销售经理'
        },
        roleCode: {
          type: 'string',
          description: '角色编码，系统内唯一标识（必填，唯一）',
          example: 'sales_manager'
        },
        description: {
          type: 'string',
          description: '角色描述',
          example: '负责销售业务管理的角色'
        },
        permissionCodes: {
          type: 'array',
          items: { type: 'string' },
          description: '权限代码数组，分配给角色的权限列表',
          example: ['menu.users', 'btn.users.add', 'btn.users.edit', 'menu.customer', 'btn.customer.export']
        }
      }
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '角色创建成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '创建成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            roleName: { type: 'string', example: '系统管理员' },
            roleCode: { type: 'string', example: 'SYSTEM_ADMIN' },
            description: { type: 'string', example: '拥有系统所有权限的管理员角色' },
            status: { type: 'string', example: 'normal' },
            sortOrder: { type: 'number', example: 1 },
            createTime: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
            updateTime: { type: 'string', example: '2024-01-20T10:30:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '请求参数错误' })
  @ApiResponse({ status: HTTP_STATUS_CODES.CONFLICT, description: '角色编码已存在' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '创建成功',
      data: role
    };
  }

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '获取成功' })
  async findAll(@Query() searchDto: RoleQueryDto) {
    const { roles, total } = await this.rolesService.findAll(searchDto);
    return ResponseUtil.page(
      roles,
      total,
      searchDto.page || 1,
      searchDto.limit || 10,
      '获取成功'
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const role = await this.rolesService.findOne(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: role
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const role = await this.rolesService.update(id, updateRoleDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '更新成功',
      data: role
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: HTTP_STATUS_CODES.OK, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.rolesService.remove(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '删除成功'
    };
  }

  @Post(':id/permissions')
  @ApiOperation({ 
    summary: '分配角色权限',
    description: '为指定角色分配菜单权限和按钮权限。该操作会清空角色原有权限，然后重新分配指定的权限列表。'
  })
  @ApiParam({ 
    name: 'id', 
    description: '角色ID', 
    example: 1 
  })
  @ApiBody({
    description: '权限分配数据',
    schema: {
      type: 'object',
      required: ['permissionCodes'],
      properties: {
        permissionCodes: {
          type: 'array',
          items: { type: 'string' },
          description: '权限代码数组，包含菜单权限和按钮权限的代码',
          example: ['menu.users', 'btn.users.add', 'btn.users.edit', 'menu.customer', 'btn.customer.export']
        }
      }
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '权限分配成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '权限分配成功' }
      }
    }
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '角色不存在' })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '权限代码无效' })
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { permissionCodes: string[] },
  ) {
    await this.rolesService.assignPermissionsByCodes(id, body.permissionCodes);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '权限分配成功'
    };
  }


} 