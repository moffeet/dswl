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
import {
  PermissionsService,
  CreatePermissionDto,
  UpdatePermissionDto
} from './permissions.service';
import { PermissionQueryDto } from '../common/dto/pagination.dto';
import { RESPONSE_CODES, RESPONSE_MESSAGES } from '../common/constants/response-codes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('🔐 权限管理')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ 
    summary: '创建权限',
    description: '创建新的菜单权限或按钮权限。菜单权限用于控制用户能访问的页面，按钮权限用于控制页面内的操作按钮显示。'
  })
  @ApiBody({
    description: '权限创建数据',
    schema: {
      type: 'object',
      required: ['permissionName', 'permissionCode', 'permissionType'],
      properties: {
        permissionName: {
          type: 'string',
          description: '权限名称',
          example: '用户管理'
        },
        permissionCode: {
          type: 'string',
          description: '权限编码，格式：menu.模块.功能 或 btn.模块.操作',
          example: 'menu.system.users'
        },
        permissionType: {
          type: 'string',
          enum: ['menu', 'button'],
          description: '权限类型：menu-菜单权限，button-按钮权限',
          example: 'menu'
        },
        parentId: {
          type: 'number',
          description: '父级权限ID，0表示顶级权限',
          example: 0
        },
        path: {
          type: 'string',
          description: '菜单路径（仅菜单权限需要）',
          example: '/users'
        },
        component: {
          type: 'string',
          description: '组件名称（仅菜单权限需要）',
          example: 'UserManage'
        },
        icon: {
          type: 'string',
          description: '图标名称',
          example: 'IconUser'
        },
        sortOrder: {
          type: 'number',
          description: '排序值，数字越小越靠前',
          example: 1
        },
        status: {
          type: 'string',
          enum: ['normal', 'disabled'],
          description: '权限状态',
          example: 'normal'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: '权限创建成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '创建成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            permissionName: { type: 'string', example: '用户管理' },
            permissionCode: { type: 'string', example: 'menu.system.users' },
            permissionType: { type: 'string', example: 'menu' },
            parentId: { type: 'number', example: 0 },
            path: { type: 'string', example: '/users' },
            component: { type: 'string', example: 'UserManage' },
            icon: { type: 'string', example: 'IconUser' },
            sortOrder: { type: 'number', example: 1 },
            status: { type: 'string', example: 'normal' },
            createTime: { type: 'string', example: '2024-01-20T10:30:00.000Z' },
            updateTime: { type: 'string', example: '2024-01-20T10:30:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '权限编码已存在' })
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
    description: '分页查询权限列表，支持按权限名称、编码、类型、状态进行筛选'
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
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  permissionName: { type: 'string', example: '用户管理' },
                  permissionCode: { type: 'string', example: 'menu.system.users' },
                  permissionType: { type: 'string', example: 'menu' },
                  parentId: { type: 'number', example: 0 },
                  path: { type: 'string', example: '/users' },
                  sortOrder: { type: 'number', example: 1 },
                  status: { type: 'string', example: 'normal' }
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
  async findAll(@Query() searchDto: PermissionQueryDto) {
    const { permissions, total } = await this.permissionsService.findAll(searchDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: {
        list: permissions,
        total,
        page: searchDto.page || 1,
        limit: searchDto.limit || 10
      }
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

  @Get('buttons')
  @ApiOperation({ 
    summary: '获取按钮权限列表',
    description: '获取所有按钮权限列表，用于角色权限配置时的按钮权限选择。按钮权限控制页面内具体操作按钮的显示与隐藏。'
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
              id: { type: 'number', example: 101 },
              permissionName: { type: 'string', example: '用户新增' },
              permissionCode: { type: 'string', example: 'btn.user.add' },
              permissionType: { type: 'string', example: 'button' },
              parentId: { type: 'number', example: 0 },
              sortOrder: { type: 'number', example: 101 },
              status: { type: 'string', example: 'normal' }
            }
          }
        }
      }
    }
  })
  async findButtonPermissions() {
    const buttons = await this.permissionsService.findButtonPermissions();
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: buttons
    };
  }

  @Get('button-tree')
  @ApiOperation({ 
    summary: '获取按钮权限树',
    description: '获取树形结构的按钮权限列表，用于角色权限配置时的按钮权限选择。返回的数据包含父子关系，可直接用于前端树形组件。按钮权限按照功能模块进行分组。'
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
              id: { type: 'number', example: 100 },
              permissionName: { type: 'string', example: '用户管理按钮' },
              permissionCode: { type: 'string', example: 'btn.user' },
              permissionType: { type: 'string', example: 'button' },
              parentId: { type: 'number', example: 0 },
              sortOrder: { type: 'number', example: 100 },
              status: { type: 'string', example: 'normal' },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 101 },
                    permissionName: { type: 'string', example: '用户新增' },
                    permissionCode: { type: 'string', example: 'btn.user.add' },
                    permissionType: { type: 'string', example: 'button' },
                    parentId: { type: 'number', example: 100 },
                    sortOrder: { type: 'number', example: 101 }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async findButtonTree() {
    const buttonTree = await this.permissionsService.findButtonTree();
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: buttonTree
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

  @Get(':id')
  @ApiOperation({ summary: '获取权限详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionsService.findOne(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: permission
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新权限' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const permission = await this.permissionsService.update(id, updatePermissionDto);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '更新成功',
      data: permission
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除权限' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsService.remove(id);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '删除成功'
    };
  }
} 