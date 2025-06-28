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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_service_1 = require("./roles.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let RolesController = class RolesController {
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    async create(createRoleDto) {
        const role = await this.rolesService.create(createRoleDto);
        return {
            code: 200,
            message: '创建成功',
            data: role
        };
    }
    async findAll(searchDto) {
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
    async findOne(id) {
        const role = await this.rolesService.findOne(id);
        return {
            code: 200,
            message: '获取成功',
            data: role
        };
    }
    async update(id, updateRoleDto) {
        const role = await this.rolesService.update(id, updateRoleDto);
        return {
            code: 200,
            message: '更新成功',
            data: role
        };
    }
    async remove(id) {
        await this.rolesService.remove(id);
        return {
            code: 200,
            message: '删除成功'
        };
    }
    async assignPermissions(id, body) {
        await this.rolesService.assignPermissions(id, body.permissionIds);
        return {
            code: 200,
            message: '权限分配成功'
        };
    }
    async updateMiniAppLogin(id, body) {
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
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: '创建角色',
        description: '创建新的系统角色，角色创建后可以为其分配菜单权限和按钮权限，用户绑定角色后即可获得对应的权限。'
    }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '角色编码已存在' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取角色列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取角色详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新角色' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除角色' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/permissions'),
    (0, swagger_1.ApiOperation)({
        summary: '分配角色权限',
        description: '为指定角色分配菜单权限和按钮权限。该操作会清空角色原有权限，然后重新分配指定的权限列表。'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: '角色ID',
        example: 1
    }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '权限分配成功',
        schema: {
            type: 'object',
            properties: {
                code: { type: 'number', example: 200 },
                message: { type: 'string', example: '权限分配成功' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '角色不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '权限ID无效' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "assignPermissions", null);
__decorate([
    (0, common_1.Patch)(':id/mini-app-login'),
    (0, swagger_1.ApiOperation)({
        summary: '更新角色小程序登录权限',
        description: '控制指定角色的用户是否可以通过小程序登录系统。管理员角色通常建议关闭，业务角色如司机、销售等建议开启。'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: '角色ID',
        example: 1
    }),
    (0, swagger_1.ApiBody)({
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
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '角色不存在' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "updateMiniAppLogin", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('👥 角色管理'),
    (0, common_1.Controller)('roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map