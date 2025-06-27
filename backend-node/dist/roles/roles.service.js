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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("./entities/role.entity");
const permission_entity_1 = require("../permissions/entities/permission.entity");
let RolesService = class RolesService {
    constructor(roleRepository, permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }
    async create(createRoleDto) {
        const existingRole = await this.roleRepository.findOne({
            where: { roleCode: createRoleDto.roleCode }
        });
        if (existingRole) {
            throw new common_1.ConflictException('角色编码已存在');
        }
        const role = this.roleRepository.create({
            roleName: createRoleDto.roleName,
            roleCode: createRoleDto.roleCode,
            description: createRoleDto.description,
            status: createRoleDto.status || '启用',
            miniAppLoginEnabled: createRoleDto.miniAppLoginEnabled
        });
        const savedRole = await this.roleRepository.save(role);
        if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
            await this.assignPermissions(savedRole.id, createRoleDto.permissionIds);
        }
        return await this.findOne(savedRole.id);
    }
    async findAll(searchDto) {
        const { page = 1, size = 10 } = searchDto, filters = __rest(searchDto, ["page", "size"]);
        const where = {};
        if (filters.roleName) {
            where.roleName = (0, typeorm_2.Like)(`%${filters.roleName}%`);
        }
        if (filters.roleCode) {
            where.roleCode = (0, typeorm_2.Like)(`%${filters.roleCode}%`);
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.miniAppLoginEnabled !== undefined) {
            where.miniAppLoginEnabled = filters.miniAppLoginEnabled;
        }
        const [roles, total] = await this.roleRepository.findAndCount({
            where,
            relations: ['permissions'],
            skip: (page - 1) * size,
            take: size,
            order: { createTime: 'DESC' }
        });
        const rolesWithUserCount = await Promise.all(roles.map(async (role) => {
            var _a;
            const userCountQuery = await this.roleRepository.manager.query('SELECT COUNT(*) as count FROM t_user_roles WHERE role_id = ?', [role.id]);
            const userCount = ((_a = userCountQuery[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
            return Object.assign(Object.assign({}, role), { userCount: parseInt(userCount) });
        }));
        return { roles: rolesWithUserCount, total };
    }
    async findOne(id) {
        const role = await this.roleRepository.findOne({
            where: { id },
            relations: ['permissions']
        });
        if (!role) {
            throw new common_1.NotFoundException('角色不存在');
        }
        return role;
    }
    async update(id, updateRoleDto) {
        const role = await this.findOne(id);
        if (updateRoleDto.roleCode && updateRoleDto.roleCode !== role.roleCode) {
            const existingRole = await this.roleRepository.findOne({
                where: { roleCode: updateRoleDto.roleCode }
            });
            if (existingRole) {
                throw new common_1.ConflictException('角色编码已存在');
            }
        }
        await this.roleRepository.update(id, {
            roleName: updateRoleDto.roleName,
            roleCode: updateRoleDto.roleCode,
            description: updateRoleDto.description,
            status: updateRoleDto.status,
            miniAppLoginEnabled: updateRoleDto.miniAppLoginEnabled
        });
        if (updateRoleDto.permissionIds !== undefined) {
            await this.assignPermissions(id, updateRoleDto.permissionIds);
        }
        return await this.findOne(id);
    }
    async remove(id) {
        const role = await this.findOne(id);
        await this.roleRepository.remove(role);
    }
    async assignPermissions(roleId, permissionIds) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
            relations: ['permissions']
        });
        if (!role) {
            throw new common_1.NotFoundException('角色不存在');
        }
        if (permissionIds.length > 0) {
            const permissions = await this.permissionRepository.find({
                where: { id: (0, typeorm_2.In)(permissionIds) }
            });
            role.permissions = permissions;
        }
        else {
            role.permissions = [];
        }
        await this.roleRepository.save(role);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map