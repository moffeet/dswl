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
exports.CreateCheckinDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const checkin_record_entity_1 = require("../entities/checkin-record.entity");
class CreateCheckinDto {
}
exports.CreateCheckinDto = CreateCheckinDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '客户ID' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCheckinDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡类型', enum: checkin_record_entity_1.CheckinType }),
    (0, class_validator_1.IsEnum)(checkin_record_entity_1.CheckinType),
    __metadata("design:type", String)
], CreateCheckinDto.prototype, "checkinType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡经度', example: 116.404 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], CreateCheckinDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡纬度', example: 39.915 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value)),
    __metadata("design:type", Number)
], CreateCheckinDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '打卡地址' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckinDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '照片URL列表', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCheckinDto.prototype, "photos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '备注', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckinDto.prototype, "remark", void 0);
//# sourceMappingURL=create-checkin.dto.js.map