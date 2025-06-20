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
exports.Driver = exports.DriverStatus = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const user_entity_1 = require("../../users/entities/user.entity");
var DriverStatus;
(function (DriverStatus) {
    DriverStatus["AVAILABLE"] = "available";
    DriverStatus["BUSY"] = "busy";
    DriverStatus["OFFLINE"] = "offline";
})(DriverStatus || (exports.DriverStatus = DriverStatus = {}));
let Driver = class Driver {
};
exports.Driver = Driver;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '司机ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Driver.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户ID' }),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", Number)
], Driver.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '司机编号' }),
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], Driver.prototype, "driverCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '姓名' }),
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Driver.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '手机号' }),
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Driver.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '身份证号', required: false }),
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "idCard", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '车牌号', required: false }),
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "vehicleNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '车型', required: false }),
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], Driver.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '司机状态', enum: DriverStatus }),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DriverStatus,
        default: DriverStatus.OFFLINE,
    }),
    __metadata("design:type", String)
], Driver.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前经度', required: false }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Number)
], Driver.prototype, "currentLongitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前纬度', required: false }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6, nullable: true }),
    __metadata("design:type", Number)
], Driver.prototype, "currentLatitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最后位置更新时间', required: false }),
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Driver.prototype, "lastLocationUpdateAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否启用' }),
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Driver.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Driver.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Driver.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Driver.prototype, "user", void 0);
exports.Driver = Driver = __decorate([
    (0, typeorm_1.Entity)('drivers')
], Driver);
//# sourceMappingURL=driver.entity.js.map