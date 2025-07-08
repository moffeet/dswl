import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { StaticPermissionsService } from './static-permissions.service';
import { RESPONSE_CODES } from '../common/constants/response-codes';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('🔐 权限管理')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly staticPermissionsService: StaticPermissionsService
  ) {}





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



  @Get('static/tree')
  @ApiOperation({
    summary: '获取静态权限树',
    description: '获取基于常量定义的权限树结构，用于角色权限配置。包含菜单权限和对应的按钮权限。'
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
              name: { type: 'string', example: '用户管理' },
              code: { type: 'string', example: 'menu.users' },
              type: { type: 'string', example: 'menu' },
              path: { type: 'string', example: '/users' },
              icon: { type: 'string', example: 'IconUser' },
              sortOrder: { type: 'number', example: 1 },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: '用户管理-新增' },
                    code: { type: 'string', example: 'btn.users.add' },
                    type: { type: 'string', example: 'button' },
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
  async getStaticPermissionTree() {
    const tree = this.staticPermissionsService.getPermissionTree();
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: tree
    };
  }

  @Get('static/all')
  @ApiOperation({
    summary: '获取所有静态权限',
    description: '获取所有基于常量定义的权限列表，包含菜单权限和按钮权限。'
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllStaticPermissions() {
    const permissions = this.staticPermissionsService.getAllPermissions();
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: permissions
    };
  }
}