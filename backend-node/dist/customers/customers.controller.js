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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const customers_service_1 = require("./customers.service");
const create_customer_dto_1 = require("./dto/create-customer.dto");
const update_customer_dto_1 = require("./dto/update-customer.dto");
const search_customer_dto_1 = require("./dto/search-customer.dto");
let CustomersController = class CustomersController {
    constructor(customersService) {
        this.customersService = customersService;
    }
    async findAll(page = 1, limit = 10) {
        try {
            const result = await this.customersService.findAll(parseInt(page.toString()), parseInt(limit.toString()));
            return {
                code: 0,
                message: '获取成功',
                data: result.data,
                total: result.total,
                page: result.page,
                limit: result.limit,
            };
        }
        catch (error) {
            return {
                code: 500,
                message: '获取失败',
                data: null,
                error: error.message,
            };
        }
    }
    async search(query) {
        try {
            const result = await this.customersService.search(query);
            return {
                code: 0,
                message: '搜索成功',
                data: result.data,
                total: result.total,
            };
        }
        catch (error) {
            return {
                code: 500,
                message: '搜索失败',
                data: null,
                error: error.message,
            };
        }
    }
    async findOne(id) {
        try {
            const customer = await this.customersService.findOne(parseInt(id));
            if (!customer) {
                return {
                    code: 404,
                    message: '客户不存在',
                    data: null,
                };
            }
            return {
                code: 0,
                message: '获取成功',
                data: customer,
            };
        }
        catch (error) {
            return {
                code: 500,
                message: '获取失败',
                data: null,
                error: error.message,
            };
        }
    }
    async create(createCustomerDto) {
        try {
            const customer = await this.customersService.create(createCustomerDto);
            return {
                code: 0,
                message: '创建成功',
                data: customer,
            };
        }
        catch (error) {
            return {
                code: 500,
                message: '创建失败',
                data: null,
                error: error.message,
            };
        }
    }
    async update(id, updateCustomerDto) {
        try {
            const customer = await this.customersService.update(parseInt(id), updateCustomerDto);
            if (!customer) {
                return {
                    code: 404,
                    message: '客户不存在',
                    data: null,
                };
            }
            return {
                code: 0,
                message: '更新成功',
                data: customer,
            };
        }
        catch (error) {
            return {
                code: 500,
                message: '更新失败',
                data: null,
                error: error.message,
            };
        }
    }
    async remove(id) {
        try {
            const customer = await this.customersService.remove(parseInt(id));
            if (!customer) {
                return {
                    code: 404,
                    message: '客户不存在',
                    data: null,
                };
            }
            return {
                code: 0,
                message: '删除成功',
                data: customer,
            };
        }
        catch (error) {
            return {
                code: 500,
                message: '删除失败',
                data: null,
                error: error.message,
            };
        }
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: '获取客户列表',
        description: '分页获取客户列表，支持页码和每页数量控制'
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: '页码，默认为1', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '每页数量，默认为10', example: 10 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        schema: {
            example: {
                code: 0,
                message: '获取成功',
                data: [
                    {
                        id: 1,
                        customerNumber: 'C001',
                        customerName: '北京华领科技有限公司',
                        customerAddress: '北京市朝阳区建国门外大街123号',
                        updateTime: '2024-01-15T10:30:00.000Z',
                        updateBy: '系统'
                    }
                ],
                total: 1,
                page: 1,
                limit: 10
            }
        }
    }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '搜索客户' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '搜索成功' }),
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_customer_dto_1.SearchCustomerDto]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "search", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取客户详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: '创建客户',
        description: '创建新客户，客户编号将自动生成（格式：C001、C002...）'
    }),
    (0, swagger_1.ApiBody)({
        type: create_customer_dto_1.CreateCustomerDto,
        description: '客户创建信息',
        examples: {
            example1: {
                summary: '创建客户示例',
                value: {
                    customerName: '李果果公司',
                    customerAddress: '广州市天河北28号'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '创建成功',
        schema: {
            example: {
                code: 0,
                message: '创建成功',
                data: {
                    id: 8,
                    customerNumber: 'C008',
                    customerName: '李果果公司',
                    customerAddress: '广州市天河北28号',
                    updateTime: '2024-01-15T10:30:00.000Z',
                    updateBy: '管理员'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_customer_dto_1.CreateCustomerDto]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新客户' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_customer_dto_1.UpdateCustomerDto]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: '删除客户',
        description: '根据客户ID删除客户信息，删除后无法恢复'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '客户ID', example: 1 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '删除成功',
        schema: {
            example: {
                code: 0,
                message: '删除成功',
                data: {
                    id: 1,
                    customerNumber: 'C001',
                    customerName: '已删除的客户'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '客户不存在' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '删除失败' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "remove", null);
exports.CustomersController = CustomersController = __decorate([
    (0, swagger_1.ApiTags)('客户管理'),
    (0, common_1.Controller)('api/customers'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map