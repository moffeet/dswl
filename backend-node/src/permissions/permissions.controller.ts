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
  ApiBody
} from '@nestjs/swagger';
import { PermissionsService, CreatePermissionDto, UpdatePermissionDto } from './permissions.service';
import { PermissionQueryDto } from '../common/dto/pagination.dto';
import { RESPONSE_CODES } from '../common/constants/response-codes';
import { ResponseUtil } from '../common/utils/response.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('🔐 权限管理')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService
  ) {}

  @Post()
  @ApiOperation({
    summary: '创建权限',
    description: '创建新的菜单权限或按钮权限。权限编码和权限名称必须唯一。'
  })
  @ApiBody({
    description: '权限创建数据',
    schema: {
      type: 'object',
      required: ['permissionName', 'permissionCode', 'permissionType', 'sortOrder'],
      properties: {
        permissionName: { type: 'string', example: '用户管理', description: '权限名称' },
        permissionCode: { type: 'string', example: 'menu.users', description: '权限编码' },
        permissionType: { type: 'string', enum: ['menu', 'button'], example: 'menu', description: '权限类型' },
        parentId: { type: 'number', example: 0, description: '父级权限ID，0表示顶级' },
        path: { type: 'string', example: '/users', description: '菜单路径' },
        component: { type: 'string', example: 'UserManage', description: '组件名称' },
        icon: { type: 'string', example: 'IconUser', description: '图标' },
        sortOrder: { type: 'number', example: 1, description: '排序值' },
        status: { type: 'string', enum: ['normal', 'disabled'], example: 'normal', description: '状态' }
      }
    }
  })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '权限编码或名称已存在' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const permission = await this.permissionsService.create(createPermissionDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '创建成功',
      data: permission
    };
  }

  @Get()
  @ApiOperation({
    summary: '获取权限列表',
    description: '分页获取权限列表，支持按权限名称、编码、类型、状态筛选。'
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() queryDto: PermissionQueryDto) {
    const { permissions, total } = await this.permissionsService.findAll(queryDto);
    return ResponseUtil.page(
      permissions,
      total,
      queryDto.page || 1,
      queryDto.limit || 10,
      '获取成功'
    );
  }

  // 将具体路由移到参数化路由之前，避免路由匹配冲突

  @Patch(':id')
  @ApiOperation({
    summary: '更新权限',
    description: '更新指定权限的信息。权限编码和权限名称必须唯一。'
  })
  @ApiParam({ name: 'id', description: '权限ID', example: 1 })
  @ApiBody({
    description: '权限更新数据',
    schema: {
      type: 'object',
      properties: {
        permissionName: { type: 'string', example: '用户管理', description: '权限名称' },
        permissionCode: { type: 'string', example: 'menu.users', description: '权限编码' },
        permissionType: { type: 'string', enum: ['menu', 'button'], example: 'menu', description: '权限类型' },
        parentId: { type: 'number', example: 0, description: '父级权限ID，0表示顶级' },
        path: { type: 'string', example: '/users', description: '菜单路径' },
        component: { type: 'string', example: 'UserManage', description: '组件名称' },
        icon: { type: 'string', example: 'IconUser', description: '图标' },
        sortOrder: { type: 'number', example: 1, description: '排序值' },
        status: { type: 'string', enum: ['normal', 'disabled'], example: 'normal', description: '状态' }
      }
    }
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @ApiResponse({ status: 409, description: '权限编码或名称已存在' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.permissionsService.update(id, updatePermissionDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '更新成功',
      data: permission
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除权限',
    description: '删除指定权限。如果权限下有子权限或被角色使用，则无法删除。'
  })
  @ApiParam({ name: 'id', description: '权限ID', example: 1 })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '权限下有子权限或被角色使用，无法删除' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsService.remove(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '删除成功'
    };
  }





  @Get('menu-tree')
  @ApiOperation({ 
    summary: '获取菜单权限树',
    description: '获取树形结构的菜单权限列表，用于角色权限配置时的菜单权限选择。返回的数据包含父子关系，可直接用于前端树形组件。'
  })
  @ApiResponse({ 
    status: 200, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              permissionName: { type: 'string', example: '系统管理' },
              permissionCode: { type: 'string', example: 'menu.system' },
              permissionType: { type: 'string', example: 'menu' },
              parentId: { type: 'number', example: 0 },
              path: { type: 'string', example: '/system' },
              icon: { type: 'string', example: 'IconSettings' },
              sortOrder: { type: 'number', example: 1 },
              status: { type: 'string', example: 'normal' },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 2 },
                    permissionName: { type: 'string', example: '用户管理' },
                    permissionCode: { type: 'string', example: 'menu.system.users' },
                    permissionType: { type: 'string', example: 'menu' },
                    parentId: { type: 'number', example: 1 },
                    path: { type: 'string', example: '/users' },
                    sortOrder: { type: 'number', example: 2 }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async findMenuTree() {
    const menuTree = await this.permissionsService.findMenuTree();
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: menuTree
    };
  }





  @Get('complete-tree')
  @ApiOperation({ 
    summary: '获取完整权限树',
    description: '获取包含菜单权限和按钮权限的完整权限树。菜单权限作为上级节点，按钮权限作为叶子节点。适用于角色权限配置界面的统一权限选择。'
  })
  @ApiResponse({ 
    status: 200, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              permissionName: { type: 'string', example: '系统管理' },
              permissionCode: { type: 'string', example: 'menu.system' },
              permissionType: { type: 'string', example: 'menu' },
              parentId: { type: 'number', example: 0 },
              path: { type: 'string', example: '/system' },
              icon: { type: 'string', example: 'IconSettings' },
              sortOrder: { type: 'number', example: 1 },
              status: { type: 'string', example: 'normal' },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 2 },
                    permissionName: { type: 'string', example: '用户管理' },
                    permissionCode: { type: 'string', example: 'menu.system.users' },
                    permissionType: { type: 'string', example: 'menu' },
                    parentId: { type: 'number', example: 1 },
                    children: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'number', example: 101 },
                          permissionName: { type: 'string', example: '用户新增' },
                          permissionCode: { type: 'string', example: 'btn.user.add' },
                          permissionType: { type: 'string', example: 'button' },
                          parentId: { type: 'number', example: 2 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async findCompleteTree() {
    const completeTree = await this.permissionsService.findCompletePermissionTree();
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: completeTree
    };
  }







  // 参数化路由放在最后，避免与具体路由冲突
  @Get(':id')
  @ApiOperation({
    summary: '获取权限详情',
    description: '根据权限ID获取权限详细信息。'
  })
  @ApiParam({ name: 'id', description: '权限ID', example: 1 })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionsService.findOne(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: permission
    };
  }
}