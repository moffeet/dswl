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
import { RolesService, CreateRoleDto, UpdateRoleDto, SearchRoleDto } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
          description: '角色名称',
          example: '系统管理员'
        },
        roleCode: {
          type: 'string',
          description: '角色编码，建议使用英文，系统内唯一',
          example: 'SYSTEM_ADMIN'
        },
        description: {
          type: 'string',
          description: '角色描述',
          example: '拥有系统所有权限的管理员角色'
        },
        status: {
          type: 'string',
          enum: ['normal', 'disabled'],
          description: '角色状态',
          example: 'normal'
        },
        sortOrder: {
          type: 'number',
          description: '排序值，数字越小越靠前',
          example: 1
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
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
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '角色编码已存在' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      code: 200,
      message: '创建成功',
      data: role
    };
  }

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() searchDto: SearchRoleDto) {
    const { roles, total } = await this.rolesService.findAll(searchDto);
    return {
      code: 200,
      message: '获取成功',
      data: {
        list: roles,
        total,
        page: searchDto.page || 1,
        size: searchDto.size || 10
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const role = await this.rolesService.findOne(id);
    return {
      code: 200,
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
      code: 200,
      message: '更新成功',
      data: role
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.rolesService.remove(id);
    return {
      code: 200,
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
      required: ['permissionIds'],
      properties: {
        permissionIds: {
          type: 'array',
          items: { type: 'number' },
          description: '权限ID数组，包含菜单权限和按钮权限的ID',
          example: [1, 2, 3, 101, 102, 103]
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '权限分配成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '权限分配成功' }
      }
    }
  })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @ApiResponse({ status: 400, description: '权限ID无效' })
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { permissionIds: number[] },
  ) {
    await this.rolesService.assignPermissions(id, body.permissionIds);
    return {
      code: 200,
      message: '权限分配成功'
    };
  }

  @Patch(':id/mini-app-login')
  @ApiOperation({ 
    summary: '更新角色小程序登录权限',
    description: '控制指定角色的用户是否可以通过小程序登录系统。管理员角色通常建议关闭，业务角色如司机、销售等建议开启。'
  })
  @ApiParam({ 
    name: 'id', 
    description: '角色ID', 
    example: 1 
  })
  @ApiBody({
    description: '小程序登录权限设置',
    schema: {
      type: 'object',
      required: ['miniAppLoginEnabled'],
      properties: {
        miniAppLoginEnabled: {
          type: 'boolean',
          description: '是否允许小程序登录',
          example: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '更新成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '小程序登录权限更新成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            miniAppLoginEnabled: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async updateMiniAppLogin(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { miniAppLoginEnabled: boolean },
  ) {
    const role = await this.rolesService.update(id, { 
      miniAppLoginEnabled: body.miniAppLoginEnabled 
    });
    return {
      code: 200,
      message: '小程序登录权限更新成功',
      data: {
        id: role.id,
        miniAppLoginEnabled: role.miniAppLoginEnabled
      }
    };
  }
} 