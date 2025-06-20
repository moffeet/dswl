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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let HealthController = class HealthController {
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: '物流配送管理系统运行正常',
            version: '1.0.0',
        };
    }
    getInfo() {
        return {
            name: '物流配送管理系统',
            version: '1.0.0',
            description: '基于 NestJS 的物流配送管理系统后端 API',
            author: '开发团队',
            node_version: process.version,
            uptime: process.uptime(),
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '健康检查' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '系统正常' }),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getHealth", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '系统信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, common_1.Get)('info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getInfo", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('系统'),
    (0, common_1.Controller)()
], HealthController);
//# sourceMappingURL=health.controller.js.map