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
    (0, swagger_1.ApiProperty)({ description: '客户ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Customer.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '客户编码' }),
    (0, typeorm_1.Column)({ name: 'customer_code', length: 50, unique: true }),
    __metadata("design:type", String)
], Customer.prototype, "customerNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '客户名称' }),
    (0, typeorm_1.Column)({ name: 'customer_name', length: 100 }),
    __metadata("design:type", String)
], Customer.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '联系人' }),
    (0, typeorm_1.Column)({ name: 'contact_person', length: 50, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "contactPerson", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '联系电话' }),
    (0, typeorm_1.Column)({ name: 'phone', length: 20, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "contactPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '详细地址' }),
    (0, typeorm_1.Column)({ name: 'address', length: 200, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "customerAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '经度' }),
    (0, typeorm_1.Column)({ name: 'longitude', type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Customer.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '纬度' }),
    (0, typeorm_1.Column)({ name: 'latitude', type: 'decimal', precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], Customer.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '省份' }),
    (0, typeorm_1.Column)({ name: 'province', length: 50, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "province", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '城市' }),
    (0, typeorm_1.Column)({ name: 'city', length: 50, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '区县' }),
    (0, typeorm_1.Column)({ name: 'district', length: 50, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "district", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所属区域' }),
    (0, typeorm_1.Column)({ name: 'area', length: 50, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "area", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '客户类型' }),
    (0, typeorm_1.Column)({ name: 'customer_type', length: 20, nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "customerType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否启用' }),
    (0, typeorm_1.Column)({ name: 'enabled', type: 'tinyint', default: 1 }),
    __metadata("design:type", String)
], Customer.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '备注' }),
    (0, typeorm_1.Column)({ name: 'remark', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Customer.prototype, "remark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)({ name: 'create_time' }),
    __metadata("design:type", Date)
], Customer.prototype, "createTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)({ name: 'update_time' }),
    __metadata("design:type", Date)
], Customer.prototype, "updateTime", void 0);
exports.Customer = Customer = __decorate([
    (0, typeorm_1.Entity)('t_customer')
], Customer);
//# sourceMappingURL=customer.entity.js.map