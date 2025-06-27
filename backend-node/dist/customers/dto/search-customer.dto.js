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
exports.CustomerSearchResultDto = exports.SearchCustomerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class SearchCustomerDto {
    constructor() {
        this.page = 1;
        this.limit = 10;
    }
}
exports.SearchCustomerDto = SearchCustomerDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户编号，支持模糊匹配',
        example: 'C001',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchCustomerDto.prototype, "customerNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户名称，支持模糊匹配',
        example: '科技',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchCustomerDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户地址，支持模糊匹配',
        example: '深圳',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchCustomerDto.prototype, "customerAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '页码，从1开始',
        example: 1,
        minimum: 1,
        default: 1,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], SearchCustomerDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '每页数量，范围1-100',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], SearchCustomerDto.prototype, "limit", void 0);
class CustomerSearchResultDto {
}
exports.CustomerSearchResultDto = CustomerSearchResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户ID',
        example: 1
    }),
    __metadata("design:type", Number)
], CustomerSearchResultDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户编号',
        example: 'C001'
    }),
    __metadata("design:type", String)
], CustomerSearchResultDto.prototype, "customerNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户名称',
        example: '深圳科技有限公司'
    }),
    __metadata("design:type", String)
], CustomerSearchResultDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '客户地址',
        example: '深圳市南山区科技园南区'
    }),
    __metadata("design:type", String)
], CustomerSearchResultDto.prototype, "customerAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '更新人',
        example: '管理员'
    }),
    __metadata("design:type", String)
], CustomerSearchResultDto.prototype, "updateBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '创建时间',
        example: '2025-06-27T06:16:28.000Z'
    }),
    __metadata("design:type", Date)
], CustomerSearchResultDto.prototype, "createTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '更新时间',
        example: '2025-06-27T08:16:28.000Z'
    }),
    __metadata("design:type", Date)
], CustomerSearchResultDto.prototype, "updateTime", void 0);
//# sourceMappingURL=search-customer.dto.js.map