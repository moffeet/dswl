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
exports.CheckinController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const checkin_service_1 = require("./checkin.service");
const create_checkin_dto_1 = require("./dto/create-checkin.dto");
const search_checkin_dto_1 = require("./dto/search-checkin.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const checkin_record_entity_1 = require("./entities/checkin-record.entity");
let CheckinController = class CheckinController {
    constructor(checkinService) {
        this.checkinService = checkinService;
    }
    async create(createCheckinDto, req) {
        return this.checkinService.create(createCheckinDto, req.user.id);
    }
    async findAll(searchDto) {
        return this.checkinService.findAll(searchDto);
    }
    async getMyCheckins(req, limit = 20) {
        return this.checkinService.findByDriver(req.user.id, limit);
    }
    async getTodayCheckins(req) {
        return this.checkinService.getTodayCheckins(req.user.id);
    }
    async getStats(driverId, startDate, endDate) {
        return this.checkinService.getCheckinStats(driverId, startDate, endDate);
    }
    async findOne(id) {
        return this.checkinService.findById(id);
    }
    async remove(id) {
        await this.checkinService.remove(id);
        return { message: '打卡记录删除成功' };
    }
};
exports.CheckinController = CheckinController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '创建打卡记录' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '打卡成功', type: checkin_record_entity_1.CheckinRecord }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_checkin_dto_1.CreateCheckinDto, Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取打卡记录列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_checkin_dto_1.SearchCheckinDto]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取我的打卡记录' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: [checkin_record_entity_1.CheckinRecord] }),
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getMyCheckins", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取今日打卡记录' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: [checkin_record_entity_1.CheckinRecord] }),
    (0, common_1.Get)('today'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getTodayCheckins", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取打卡统计' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('driverId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getStats", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取打卡记录详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功', type: checkin_record_entity_1.CheckinRecord }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '删除打卡记录' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "remove", null);
exports.CheckinController = CheckinController = __decorate([
    (0, swagger_1.ApiTags)('打卡管理'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('checkin'),
    __metadata("design:paramtypes", [checkin_service_1.CheckinService])
], CheckinController);
//# sourceMappingURL=checkin.controller.js.map