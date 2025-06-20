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
exports.CheckinService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const checkin_record_entity_1 = require("./entities/checkin-record.entity");
let CheckinService = class CheckinService {
    constructor(checkinRepository) {
        this.checkinRepository = checkinRepository;
    }
    async create(createCheckinDto, driverId) {
        const checkin = this.checkinRepository.create(Object.assign(Object.assign({}, createCheckinDto), { driverId, checkinTime: new Date() }));
        return this.checkinRepository.save(checkin);
    }
    async findAll(searchDto) {
        const { driverId, customerId, checkinType, startDate, endDate, page = 1, limit = 10 } = searchDto;
        const queryBuilder = this.checkinRepository.createQueryBuilder('checkin')
            .leftJoinAndSelect('checkin.driver', 'driver')
            .leftJoinAndSelect('checkin.customer', 'customer');
        if (driverId) {
            queryBuilder.andWhere('checkin.driverId = :driverId', { driverId });
        }
        if (customerId) {
            queryBuilder.andWhere('checkin.customerId = :customerId', { customerId });
        }
        if (checkinType) {
            queryBuilder.andWhere('checkin.checkinType = :checkinType', { checkinType });
        }
        if (startDate && endDate) {
            queryBuilder.andWhere('checkin.checkinTime BETWEEN :startDate AND :endDate', {
                startDate: new Date(startDate),
                endDate: new Date(endDate + ' 23:59:59'),
            });
        }
        else if (startDate) {
            queryBuilder.andWhere('checkin.checkinTime >= :startDate', {
                startDate: new Date(startDate),
            });
        }
        else if (endDate) {
            queryBuilder.andWhere('checkin.checkinTime <= :endDate', {
                endDate: new Date(endDate + ' 23:59:59'),
            });
        }
        queryBuilder
            .orderBy('checkin.checkinTime', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const [data, total] = await queryBuilder.getManyAndCount();
        return {
            data,
            total,
            page,
            limit,
        };
    }
    async findById(id) {
        const checkin = await this.checkinRepository.findOne({
            where: { id },
            relations: ['driver', 'customer'],
        });
        if (!checkin) {
            throw new common_1.NotFoundException('打卡记录不存在');
        }
        return checkin;
    }
    async findByDriver(driverId, limit = 20) {
        return this.checkinRepository.find({
            where: { driverId },
            relations: ['customer'],
            order: { checkinTime: 'DESC' },
            take: limit,
        });
    }
    async remove(id) {
        const checkin = await this.findById(id);
        await this.checkinRepository.remove(checkin);
    }
    async getTodayCheckins(driverId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        return this.checkinRepository.find({
            where: {
                driverId,
                checkinTime: (0, typeorm_2.Between)(startOfDay, endOfDay),
            },
            relations: ['customer'],
            order: { checkinTime: 'DESC' },
        });
    }
    async getCheckinStats(driverId, startDate, endDate) {
        const queryBuilder = this.checkinRepository.createQueryBuilder('checkin');
        if (driverId) {
            queryBuilder.where('checkin.driverId = :driverId', { driverId });
        }
        if (startDate && endDate) {
            queryBuilder.andWhere('checkin.checkinTime BETWEEN :startDate AND :endDate', {
                startDate: new Date(startDate),
                endDate: new Date(endDate + ' 23:59:59'),
            });
        }
        const total = await queryBuilder.getCount();
        const typeStats = await queryBuilder
            .select('checkin.checkinType', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('checkin.checkinType')
            .getRawMany();
        return {
            total,
            typeStats,
        };
    }
};
exports.CheckinService = CheckinService;
exports.CheckinService = CheckinService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(checkin_record_entity_1.CheckinRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CheckinService);
//# sourceMappingURL=checkin.service.js.map