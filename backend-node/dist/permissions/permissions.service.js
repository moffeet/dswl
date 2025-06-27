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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permission_entity_1 = require("./entities/permission.entity");
let PermissionsService = class PermissionsService {
    constructor(permissionRepository) {
        this.permissionRepository = permissionRepository;
    }
    async create(createPermissionDto) {
        const existingPermission = await this.permissionRepository.findOne({
            where: { permissionCode: createPermissionDto.permissionCode }
        });
        if (existingPermission) {
            throw new common_1.ConflictException('权限编码已存在');
        }
        const permission = this.permissionRepository.create(Object.assign(Object.assign({}, createPermissionDto), { parentId: createPermissionDto.parentId || 0, sortOrder: createPermissionDto.sortOrder || 0, status: createPermissionDto.status || 'normal' }));
        return await this.permissionRepository.save(permission);
    }
    async findAll(searchDto) {
        const { page = 1, size = 10 } = searchDto, filters = __rest(searchDto, ["page", "size"]);
        const where = {};
        if (filters.permissionName) {
            where.permissionName = (0, typeorm_2.Like)(`%${filters.permissionName}%`);
        }
        if (filters.permissionCode) {
            where.permissionCode = (0, typeorm_2.Like)(`%${filters.permissionCode}%`);
        }
        if (filters.permissionType) {
            where.permissionType = filters.permissionType;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        const [permissions, total] = await this.permissionRepository.findAndCount({
            where,
            skip: (page - 1) * size,
            take: size,
            order: { sortOrder: 'ASC', createTime: 'DESC' }
        });
        return { permissions, total };
    }
    async findMenuTree() {
        const menuPermissions = await this.permissionRepository.find({
            where: { permissionType: 'menu', status: 'normal' },
            order: { sortOrder: 'ASC' }
        });
        return this.buildTree(menuPermissions);
    }
    async findButtonPermissions() {
        return await this.permissionRepository.find({
            where: { permissionType: 'button', status: 'normal' },
            order: { sortOrder: 'ASC' }
        });
    }
    async findOne(id) {
        const permission = await this.permissionRepository.findOne({
            where: { id }
        });
        if (!permission) {
            throw new common_1.NotFoundException('权限不存在');
        }
        return permission;
    }
    async update(id, updatePermissionDto) {
        const permission = await this.findOne(id);
        if (updatePermissionDto.permissionCode && updatePermissionDto.permissionCode !== permission.permissionCode) {
            const existingPermission = await this.permissionRepository.findOne({
                where: { permissionCode: updatePermissionDto.permissionCode }
            });
            if (existingPermission) {
                throw new common_1.ConflictException('权限编码已存在');
            }
        }
        await this.permissionRepository.update(id, updatePermissionDto);
        return await this.findOne(id);
    }
    async remove(id) {
        const permission = await this.findOne(id);
        const children = await this.permissionRepository.find({
            where: { parentId: id }
        });
        if (children.length > 0) {
            throw new common_1.ConflictException('存在子权限，无法删除');
        }
        await this.permissionRepository.remove(permission);
    }
    buildTree(permissions, parentId = 0) {
        const result = [];
        for (const permission of permissions) {
            const permParentId = typeof permission.parentId === 'string' ? parseInt(permission.parentId) : permission.parentId;
            const targetParentId = typeof parentId === 'string' ? parseInt(parentId) : parentId;
            if (permParentId === targetParentId) {
                const children = this.buildTree(permissions, permission.id);
                const node = Object.assign(Object.assign({}, permission), { children: children.length > 0 ? children : undefined });
                result.push(node);
            }
        }
        return result;
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map