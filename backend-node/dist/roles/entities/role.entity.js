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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const typeorm_1 = require("typeorm");
const permission_entity_1 = require("../../permissions/entities/permission.entity");
let Role = class Role {
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ comment: '角色ID' }),
    __metadata("design:type", Number)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role_name', length: 50, comment: '角色名称' }),
    __metadata("design:type", String)
], Role.prototype, "roleName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role_code', length: 50, unique: true, comment: '角色编码' }),
    __metadata("design:type", String)
], Role.prototype, "roleCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '角色描述' }),
    __metadata("design:type", String)
], Role.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['启用', '禁用'], default: '启用', comment: '角色状态' }),
    __metadata("design:type", String)
], Role.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mini_app_login_enabled', type: 'boolean', default: false, comment: '是否允许小程序登录' }),
    __metadata("design:type", Boolean)
], Role.prototype, "miniAppLoginEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'create_by', type: 'bigint', nullable: true, comment: '创建人ID' }),
    __metadata("design:type", Number)
], Role.prototype, "createBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'create_time', comment: '创建时间' }),
    __metadata("design:type", Date)
], Role.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'update_time', comment: '更新时间' }),
    __metadata("design:type", Date)
], Role.prototype, "updateTime", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => permission_entity_1.Permission),
    (0, typeorm_1.JoinTable)({
        name: 't_role_permissions',
        joinColumn: { name: 'role_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' }
    }),
    __metadata("design:type", Array)
], Role.prototype, "permissions", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)('t_roles')
], Role);
//# sourceMappingURL=role.entity.js.map