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
exports.Permission = void 0;
const typeorm_1 = require("typeorm");
let Permission = class Permission {
};
exports.Permission = Permission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ comment: '权限ID' }),
    __metadata("design:type", Number)
], Permission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_name', length: 100, comment: '权限名称' }),
    __metadata("design:type", String)
], Permission.prototype, "permissionName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_code', length: 100, unique: true, comment: '权限编码' }),
    __metadata("design:type", String)
], Permission.prototype, "permissionCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'permission_type', type: 'enum', enum: ['menu', 'button'], comment: '权限类型：menu-菜单权限，button-按钮权限' }),
    __metadata("design:type", String)
], Permission.prototype, "permissionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id', type: 'bigint', default: 0, comment: '父级权限ID，0表示顶级' }),
    __metadata("design:type", Number)
], Permission.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true, comment: '菜单路径' }),
    __metadata("design:type", String)
], Permission.prototype, "path", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true, comment: '组件路径' }),
    __metadata("design:type", String)
], Permission.prototype, "component", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '图标' }),
    __metadata("design:type", String)
], Permission.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0, comment: '排序' }),
    __metadata("design:type", Number)
], Permission.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['normal', 'disabled'], default: 'normal', comment: '权限状态' }),
    __metadata("design:type", String)
], Permission.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'create_time', comment: '创建时间' }),
    __metadata("design:type", Date)
], Permission.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'update_time', comment: '更新时间' }),
    __metadata("design:type", Date)
], Permission.prototype, "updateTime", void 0);
exports.Permission = Permission = __decorate([
    (0, typeorm_1.Entity)('t_permissions')
], Permission);
//# sourceMappingURL=permission.entity.js.map