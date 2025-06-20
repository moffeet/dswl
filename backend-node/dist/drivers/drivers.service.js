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
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("./entities/driver.entity");
let DriversService = class DriversService {
    constructor(driversRepository) {
        this.driversRepository = driversRepository;
    }
    async create(createDriverDto) {
        const existingDriver = await this.driversRepository.findOne({
            where: { driverCode: createDriverDto.driverCode },
        });
        if (existingDriver) {
            throw new common_1.ConflictException('司机编号已存在');
        }
        const existingUserDriver = await this.driversRepository.findOne({
            where: { userId: createDriverDto.userId },
        });
        if (existingUserDriver) {
            throw new common_1.ConflictException('该用户已绑定司机信息');
        }
        const driver = this.driversRepository.create(createDriverDto);
        return this.driversRepository.save(driver);
    }
    async findAll() {
        return this.driversRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }
    async findById(id) {
        const driver = await this.driversRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!driver) {
            throw new common_1.NotFoundException('司机不存在');
        }
        return driver;
    }
    async findByUserId(userId) {
        const driver = await this.driversRepository.findOne({
            where: { userId },
            relations: ['user'],
        });
        if (!driver) {
            throw new common_1.NotFoundException('司机信息不存在');
        }
        return driver;
    }
    async update(id, updateDriverDto) {
        const driver = await this.findById(id);
        if (updateDriverDto.driverCode && updateDriverDto.driverCode !== driver.driverCode) {
            const existingDriver = await this.driversRepository.findOne({
                where: { driverCode: updateDriverDto.driverCode },
            });
            if (existingDriver) {
                throw new common_1.ConflictException('司机编号已存在');
            }
        }
        await this.driversRepository.update(id, updateDriverDto);
        return this.findById(id);
    }
    async updateLocation(userId, updateLocationDto) {
        const driver = await this.findByUserId(userId);
        await this.driversRepository.update(driver.id, {
            currentLongitude: updateLocationDto.longitude,
            currentLatitude: updateLocationDto.latitude,
            lastLocationUpdateAt: new Date(),
        });
        return this.findById(driver.id);
    }
    async updateStatus(userId, status) {
        const driver = await this.findByUserId(userId);
        await this.driversRepository.update(driver.id, { status });
        return this.findById(driver.id);
    }
    async remove(id) {
        const driver = await this.findById(id);
        await this.driversRepository.remove(driver);
    }
    async findActiveDrivers() {
        return this.driversRepository.find({
            where: {
                enabled: true,
                status: driver_entity_1.DriverStatus.AVAILABLE,
            },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }
    async getDriverInfo(userId) {
        return this.findByUserId(userId);
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DriversService);
//# sourceMappingURL=drivers.service.js.map