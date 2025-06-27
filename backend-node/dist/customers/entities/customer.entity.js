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
exports.Customer = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let Customer = class Customer {
};
exports.Customer = Customer;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户ID，主键，自动递增',
        example: 1,
        type: 'number'
    }),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Customer.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户编号，系统自动生成，格式：C001、C002...，全局唯一',
        example: 'C001',
        maxLength: 50,
        uniqueItems: true
    }),
    (0, typeorm_1.Column)({ name: 'customerNumber', length: 50, unique: true }),
    __metadata("design:type", String)
], Customer.prototype, "customerNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户名称，必填字段',
        example: '深圳科技有限公司',
        maxLength: 100
    }),
    (0, typeorm_1.Column)({ name: 'customerName', length: 100 }),
    __metadata("design:type", String)
], Customer.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户地址，可选字段',
        example: '深圳市南山区科技园南区',
        maxLength: 255,
        required: false
    }),
    (0, typeorm_1.Column)({ name: 'customerAddress', length: 255, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "customerAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '更新人，记录最后修改该客户信息的用户',
        example: '管理员',
        maxLength: 50,
        required: false
    }),
    (0, typeorm_1.Column)({ name: 'updateBy', length: 50, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "updateBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '创建时间，记录自动生成',
        example: '2025-06-27T06:16:28.000Z',
        type: 'string',
        format: 'date-time'
    }),
    (0, typeorm_1.CreateDateColumn)({ name: 'createdAt' }),
    __metadata("design:type", Date)
], Customer.prototype, "createTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '更新时间，每次修改时自动更新',
        example: '2025-06-27T08:16:28.000Z',
        type: 'string',
        format: 'date-time'
    }),
    (0, typeorm_1.UpdateDateColumn)({ name: 'updatedAt' }),
    __metadata("design:type", Date)
], Customer.prototype, "updateTime", void 0);
exports.Customer = Customer = __decorate([
    (0, typeorm_1.Entity)('t_customers')
], Customer);
//# sourceMappingURL=customer.entity.js.map