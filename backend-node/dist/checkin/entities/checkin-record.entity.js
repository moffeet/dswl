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
exports.CheckinRecord = exports.CheckinType = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const user_entity_1 = require("../../users/entities/user.entity");
const customer_entity_1 = require("../../customers/entities/customer.entity");
var CheckinType;
(function (CheckinType) {
    CheckinType["DELIVERY"] = "delivery";
    CheckinType["PICKUP"] = "pickup";
    CheckinType["VISIT"] = "visit";
})(CheckinType || (exports.CheckinType = CheckinType = {}));
let CheckinRecord = class CheckinRecord {
};
exports.CheckinRecord = CheckinRecord;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡记录ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CheckinRecord.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '司机用户ID' }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CheckinRecord.prototype, "driverId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '客户ID' }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CheckinRecord.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡类型', enum: CheckinType }),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CheckinType,
        default: CheckinType.DELIVERY,
    }),
    __metadata("design:type", String)
], CheckinRecord.prototype, "checkinType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡经度' }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6 }),
    __metadata("design:type", Number)
], CheckinRecord.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡纬度' }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 6 }),
    __metadata("design:type", Number)
], CheckinRecord.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡地址' }),
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], CheckinRecord.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '照片URL列表' }),
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], CheckinRecord.prototype, "photos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '备注', required: false }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CheckinRecord.prototype, "remark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡时间' }),
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], CheckinRecord.prototype, "checkinTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CheckinRecord.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CheckinRecord.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'driverId' }),
    __metadata("design:type", user_entity_1.User)
], CheckinRecord.prototype, "driver", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer),
    (0, typeorm_1.JoinColumn)({ name: 'customerId' }),
    __metadata("design:type", customer_entity_1.Customer)
], CheckinRecord.prototype, "customer", void 0);
exports.CheckinRecord = CheckinRecord = __decorate([
    (0, typeorm_1.Entity)('checkin_records')
], CheckinRecord);
//# sourceMappingURL=checkin-record.entity.js.map