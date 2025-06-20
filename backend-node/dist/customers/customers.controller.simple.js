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
const mockCustomers = [
    {
        id: 1,
        customerNumber: 'C001',
        customerName: '北京华强科技有限公司',
        customerAddress: '北京市朝阳区建国路88号',
        contactPerson: '张经理',
        contactPhone: '13800138001',
        area: '华北',
        status: 'active',
        latitude: 39.9042,
        longitude: 116.4074,
        createTime: '2024-01-15T08:30:00Z',
    },
    {
        id: 2,
        customerNumber: 'C002',
        customerName: '上海创新物流集团',
        customerAddress: '上海市浦东新区世纪大道1000号',
        contactPerson: '李总',
        contactPhone: '13800138002',
        area: '华东',
        status: 'active',
        latitude: 31.2304,
        longitude: 121.4737,
        createTime: '2024-02-20T09:15:00Z',
    },
    {
        id: 3,
        customerNumber: 'C003',
        customerName: '深圳智慧供应链公司',
        customerAddress: '深圳市南山区科技园南路35号',
        contactPerson: '王主任',
        contactPhone: '13800138003',
        area: '华南',
        status: 'active',
        latitude: 22.5431,
        longitude: 114.0579,
        createTime: '2024-03-10T10:45:00Z',
    },
];
let CustomersController = class CustomersController {
    findAll(page = 1, limit = 10) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit.toString());
        const data = mockCustomers.slice(startIndex, endIndex);
        return {
            code: 0,
            message: '获取成功',
            data,
            total: mockCustomers.length,
            page: parseInt(page.toString()),
            limit: parseInt(limit.toString()),
        };
    }
    search(query) {
        let results = [...mockCustomers];
        if (query.customerNumber) {
            results = results.filter(c => c.customerNumber.includes(query.customerNumber));
        }
        if (query.customerName) {
            results = results.filter(c => c.customerName.includes(query.customerName));
        }
        if (query.customerAddress) {
            results = results.filter(c => c.customerAddress.includes(query.customerAddress));
        }
        if (query.area) {
            results = results.filter(c => c.area === query.area);
        }
        return {
            code: 0,
            message: '搜索成功',
            data: results,
            total: results.length,
        };
    }
    findOne(id) {
        const customer = mockCustomers.find(c => c.id === parseInt(id));
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
    create(createCustomerDto) {
        const newCustomer = Object.assign(Object.assign({ id: mockCustomers.length + 1, customerNumber: `C${String(mockCustomers.length + 1).padStart(3, '0')}` }, createCustomerDto), { createTime: new Date().toISOString() });
        mockCustomers.push(newCustomer);
        return {
            code: 0,
            message: '创建成功',
            data: newCustomer,
        };
    }
    update(id, updateCustomerDto) {
        const index = mockCustomers.findIndex(c => c.id === parseInt(id));
        if (index === -1) {
            return {
                code: 404,
                message: '客户不存在',
                data: null,
            };
        }
        mockCustomers[index] = Object.assign(Object.assign({}, mockCustomers[index]), updateCustomerDto);
        return {
            code: 0,
            message: '更新成功',
            data: mockCustomers[index],
        };
    }
    remove(id) {
        const index = mockCustomers.findIndex(c => c.id === parseInt(id));
        if (index === -1) {
            return {
                code: 404,
                message: '客户不存在',
                data: null,
            };
        }
        const deletedCustomer = mockCustomers.splice(index, 1)[0];
        return {
            code: 0,
            message: '删除成功',
            data: deletedCustomer,
        };
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取客户列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '搜索客户' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '搜索成功' }),
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "search", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取客户详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '创建客户' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新客户' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '删除客户' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "remove", null);
exports.CustomersController = CustomersController = __decorate([
    (0, swagger_1.ApiTags)('客户管理'),
    (0, common_1.Controller)('api/customers')
], CustomersController);
//# sourceMappingURL=customers.controller.simple.js.map