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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let User = class User {
};
exports.User = User;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)({ comment: '用户ID' }),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名' }),
    (0, typeorm_1.Column)({ length: 50, unique: true, comment: '用户名' }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '密码（加密后）' }),
    (0, typeorm_1.Column)({ length: 255, comment: '密码（加密后）' }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '昵称', required: false }),
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '昵称' }),
    __metadata("design:type", String)
], User.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '手机号', required: false }),
    (0, typeorm_1.Column)({ length: 20, nullable: true, comment: '手机号' }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '邮箱', required: false }),
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '邮箱' }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '性别', enum: ['男', '女'], required: false }),
    (0, typeorm_1.Column)({ type: 'enum', enum: ['男', '女'], nullable: true, comment: '性别' }),
    __metadata("design:type", String)
], User.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户状态', enum: ['启用', '禁用'] }),
    (0, typeorm_1.Column)({ type: 'enum', enum: ['启用', '禁用'], default: '启用', comment: '用户状态' }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '头像URL', required: false }),
    (0, typeorm_1.Column)({ length: 255, nullable: true, comment: '头像URL' }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最后登录时间', required: false }),
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true, comment: '最后登录时间' }),
    __metadata("design:type", Date)
], User.prototype, "lastLoginTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最后登录IP', required: false }),
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '最后登录IP' }),
    __metadata("design:type", String)
], User.prototype, "lastLoginIp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建人ID', required: false }),
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true, comment: '创建人ID' }),
    __metadata("design:type", Number)
], User.prototype, "createBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)({ comment: '创建时间' }),
    __metadata("design:type", Date)
], User.prototype, "createTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)({ comment: '更新时间' }),
    __metadata("design:type", Date)
], User.prototype, "updateTime", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('t_users')
], User);
//# sourceMappingURL=user.entity.js.map