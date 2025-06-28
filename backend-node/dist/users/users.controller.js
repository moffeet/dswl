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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const search_user_dto_1 = require("./dto/search-user.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async create(createUserDto) {
        const user = await this.usersService.create(createUserDto);
        const { password } = user, result = __rest(user, ["password"]);
        return {
            code: 200,
            message: '创建成功',
            data: result
        };
    }
    async findAll(searchDto) {
        const { users, total } = await this.usersService.findAll(searchDto);
        const safeUsers = users.map(user => {
            const { password } = user, safeUser = __rest(user, ["password"]);
            return safeUser;
        });
        return {
            code: 200,
            message: '获取成功',
            data: {
                list: safeUsers,
                total,
                page: searchDto.page || 1,
                size: searchDto.size || 10
            }
        };
    }
    async findOne(id) {
        const user = await this.usersService.findOne(id);
        const { password } = user, result = __rest(user, ["password"]);
        return {
            code: 200,
            message: '获取成功',
            data: result
        };
    }
    async update(id, updateUserDto) {
        const user = await this.usersService.update(id, updateUserDto);
        const { password } = user, result = __rest(user, ["password"]);
        return {
            code: 200,
            message: '更新成功',
            data: result
        };
    }
    async remove(id) {
        await this.usersService.remove(id);
        return {
            code: 200,
            message: '删除成功'
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: '创建用户',
        description: '创建新的系统用户，用户创建后可以分配角色获得相应权限。密码会自动加密存储，返回数据不包含密码字段。'
    }),
    (0, swagger_1.ApiBody)({
        description: '用户创建数据',
        schema: {
            type: 'object',
            required: ['username', 'password', 'nickname'],
            properties: {
                username: {
                    type: 'string',
                    description: '用户名，系统内唯一',
                    example: 'admin'
                },
                password: {
                    type: 'string',
                    description: '登录密码，最少6位',
                    minLength: 6,
                    example: 'admin123'
                },
                nickname: {
                    type: 'string',
                    description: '用户昵称',
                    example: '管理员'
                },
                gender: {
                    type: 'string',
                    enum: ['male', 'female'],
                    description: '性别',
                    example: 'male'
                },
                phone: {
                    type: 'string',
                    description: '手机号码',
                    example: '13800138000'
                },
                email: {
                    type: 'string',
                    description: '邮箱地址',
                    format: 'email',
                    example: 'admin@example.com'
                },
                status: {
                    type: 'string',
                    enum: ['normal', 'disabled'],
                    description: '用户状态',
                    example: 'normal'
                },
                roleIds: {
                    type: 'array',
                    items: { type: 'number' },
                    description: '角色ID数组',
                    example: [1, 2]
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '用户名已存在' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '获取用户列表',
        description: '分页查询用户列表，支持按用户名、昵称、手机号、邮箱、性别、状态进行筛选。返回数据不包含密码字段。'
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: '页码', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, description: '每页数量', example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'username', required: false, description: '用户名（模糊匹配）', example: 'admin' }),
    (0, swagger_1.ApiQuery)({ name: 'nickname', required: false, description: '昵称（模糊匹配）', example: '管理员' }),
    (0, swagger_1.ApiQuery)({ name: 'phone', required: false, description: '手机号（模糊匹配）', example: '138' }),
    (0, swagger_1.ApiQuery)({ name: 'email', required: false, description: '邮箱（模糊匹配）', example: 'admin' }),
    (0, swagger_1.ApiQuery)({ name: 'gender', required: false, description: '性别', enum: ['male', 'female'] }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: '用户状态', enum: ['normal', 'disabled'] }),
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
    __metadata("design:paramtypes", [search_user_dto_1.SearchUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取用户详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新用户' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除用户' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('👤 用户管理'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map