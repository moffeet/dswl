"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_service_1 = require("./permissions.service");
let PermissionsController = class PermissionsController {
    constructor(permissionsService) {
        this.permissionsService = permissionsService;
    }
    async create(createPermissionDto) {
        const permission = await this.permissionsService.create(createPermissionDto);
        return {
            code: 200,
            message: '创建成功',
            data: permission
        };
    }
    async findAll(searchDto) {
        const { permissions, total } = await this.permissionsService.findAll(searchDto);
        return {
            code: 200,
            message: '获取成功',
            data: {
                list: permissions,
                total,
                page: searchDto.page || 1,
                size: searchDto.size || 10
            }
        };
    }
    async findMenuTree() {
        const menuTree = await this.permissionsService.findMenuTree();
        return {
            code: 200,
            message: '获取成功',
            data: menuTree
        };
    }
    async findButtonPermissions() {
        const buttons = await this.permissionsService.findButtonPermissions();
        return {
            code: 200,
            message: '获取成功',
            data: buttons
        };
    }
    async findButtonTree() {
        const buttonTree = await this.permissionsService.findButtonTree();
        return {
            code: 200,
            message: '获取成功',
            data: buttonTree
        };
    }
    async findCompleteTree() {
        const completeTree = await this.permissionsService.findCompletePermissionTree();
        return {
            code: 200,
            message: '获取成功',
            data: completeTree
        };
    }
    async findOne(id) {
        const permission = await this.permissionsService.findOne(id);
        return {
            code: 200,
            message: '获取成功',
            data: permission
        };
    }
    async update(id, updatePermissionDto) {
        const permission = await this.permissionsService.update(id, updatePermissionDto);
        return {
            code: 200,
            message: '更新成功',
            data: permission
        };
    }
    async remove(id) {
        await this.permissionsService.remove(id);
        return {
            code: 200,
            message: '删除成功'
        };
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: '创建权限',
        description: '创建新的菜单权限或按钮权限。菜单权限用于控制用户能访问的页面，按钮权限用于控制页面内的操作按钮显示。'
    }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '权限编码已存在' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '获取权限列表',
        description: '分页查询权限列表，支持按权限名称、编码、类型、状态进行筛选'
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: '页码', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, description: '每页数量', example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'permissionName', required: false, description: '权限名称（模糊匹配）', example: '用户' }),
    (0, swagger_1.ApiQuery)({ name: 'permissionCode', required: false, description: '权限编码（模糊匹配）', example: 'menu.system' }),
    (0, swagger_1.ApiQuery)({ name: 'permissionType', required: false, description: '权限类型', enum: ['menu', 'button'] }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: '权限状态', enum: ['normal', 'disabled'] }),
    (0, swagger_1.ApiResponse)({
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
                        size: { type: 'number', example: 10 }
                    }
                }
            }
        }
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('menu-tree'),
    (0, swagger_1.ApiOperation)({
        summary: '获取菜单权限树',
        description: '获取树形结构的菜单权限列表，用于角色权限配置时的菜单权限选择。返回的数据包含父子关系，可直接用于前端树形组件。'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findMenuTree", null);
__decorate([
    (0, common_1.Get)('buttons'),
    (0, swagger_1.ApiOperation)({
        summary: '获取按钮权限列表',
        description: '获取所有按钮权限列表，用于角色权限配置时的按钮权限选择。按钮权限控制页面内具体操作按钮的显示与隐藏。'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findButtonPermissions", null);
__decorate([
    (0, common_1.Get)('button-tree'),
    (0, swagger_1.ApiOperation)({
        summary: '获取按钮权限树',
        description: '获取树形结构的按钮权限列表，用于角色权限配置时的按钮权限选择。返回的数据包含父子关系，可直接用于前端树形组件。按钮权限按照功能模块进行分组。'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findButtonTree", null);
__decorate([
    (0, common_1.Get)('complete-tree'),
    (0, swagger_1.ApiOperation)({
        summary: '获取完整权限树',
        description: '获取包含菜单权限和按钮权限的完整权限树。菜单权限作为上级节点，按钮权限作为叶子节点。适用于角色权限配置界面的统一权限选择。'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findCompleteTree", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取权限详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新权限' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除权限' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "remove", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, swagger_1.ApiTags)('🔐 权限管理'),
    (0, common_1.Controller)('permissions'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService])
], PermissionsController);
//# sourceMappingURL=permissions.controller.js.map