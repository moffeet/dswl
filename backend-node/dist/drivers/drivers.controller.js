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
exports.DriversController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const drivers_service_1 = require("./drivers.service");
const create_driver_dto_1 = require("./dto/create-driver.dto");
const update_driver_dto_1 = require("./dto/update-driver.dto");
const update_location_dto_1 = require("./dto/update-location.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const driver_entity_1 = require("./entities/driver.entity");
let DriversController = class DriversController {
    constructor(driversService) {
        this.driversService = driversService;
    }
    async create(createDriverDto) {
        return this.driversService.create(createDriverDto);
    }
    async findAll() {
        return this.driversService.findAll();
    }
    async findActiveDrivers() {
        return this.driversService.findActiveDrivers();
    }
    async getMyDriverInfo(req) {
        return this.driversService.getDriverInfo(req.user.id);
    }
    async updateLocation(updateLocationDto, req) {
        return this.driversService.updateLocation(req.user.id, updateLocationDto);
    }
    async updateStatus(status, req) {
        return this.driversService.updateStatus(req.user.id, status);
    }
    async findOne(id) {
        return this.driversService.findById(id);
    }
    async update(id, updateDriverDto) {
        return this.driversService.update(id, updateDriverDto);
    }
    async remove(id) {
        await this.driversService.remove(id);
        return { message: '司机删除成功' };
    }
};
exports.DriversController = DriversController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '创建司机' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '司机创建成功', type: driver_entity_1.Driver }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_driver_dto_1.CreateDriverDto]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取司机列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: [driver_entity_1.Driver] }),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取活跃司机列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: [driver_entity_1.Driver] }),
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "findActiveDrivers", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取当前用户的司机信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: driver_entity_1.Driver }),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "getMyDriverInfo", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新司机位置' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '位置更新成功', type: driver_entity_1.Driver }),
    (0, common_1.Patch)('location'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_location_dto_1.UpdateLocationDto, Object]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "updateLocation", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新司机状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '状态更新成功', type: driver_entity_1.Driver }),
    (0, common_1.Patch)('status'),
    __param(0, (0, common_1.Body)('status')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "updateStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取司机详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: driver_entity_1.Driver }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新司机' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功', type: driver_entity_1.Driver }),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_driver_dto_1.UpdateDriverDto]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '删除司机' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "remove", null);
exports.DriversController = DriversController = __decorate([
    (0, swagger_1.ApiTags)('司机管理'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('drivers'),
    __metadata("design:paramtypes", [drivers_service_1.DriversService])
], DriversController);
//# sourceMappingURL=drivers.controller.js.map