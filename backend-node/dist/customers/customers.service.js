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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("./entities/customer.entity");
let CustomersService = class CustomersService {
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
    }
    async create(createCustomerDto) {
        const lastCustomer = await this.customerRepository
            .createQueryBuilder('customer')
            .orderBy('customer.id', 'DESC')
            .getOne();
        const nextNumber = lastCustomer ? lastCustomer.id + 1 : 1;
        const customerNumber = `C${String(nextNumber).padStart(3, '0')}`;
        const customer = this.customerRepository.create(Object.assign(Object.assign({}, createCustomerDto), { customerNumber, updateBy: '管理员' }));
        return await this.customerRepository.save(customer);
    }
    async findAll(page = 1, limit = 10) {
        const [data, total] = await this.customerRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createTime: 'DESC' },
        });
        return {
            data,
            total,
            page,
            limit,
        };
    }
    async search(searchDto) {
        const queryBuilder = this.customerRepository.createQueryBuilder('customer');
        if (searchDto.customerNumber) {
            queryBuilder.andWhere('customer.customerNumber LIKE :customerNumber', {
                customerNumber: `%${searchDto.customerNumber}%`,
            });
        }
        if (searchDto.customerName) {
            queryBuilder.andWhere('customer.customerName LIKE :customerName', {
                customerName: `%${searchDto.customerName}%`,
            });
        }
        if (searchDto.customerAddress) {
            queryBuilder.andWhere('customer.customerAddress LIKE :customerAddress', {
                customerAddress: `%${searchDto.customerAddress}%`,
            });
        }
        const page = searchDto.page || 1;
        const limit = searchDto.limit || 10;
        queryBuilder
            .orderBy('customer.createTime', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const [data, total] = await queryBuilder.getManyAndCount();
        return {
            data,
            total,
        };
    }
    async findOne(id) {
        return await this.customerRepository.findOne({
            where: { id },
        });
    }
    async update(id, updateCustomerDto) {
        await this.customerRepository.update(id, updateCustomerDto);
        return await this.findOne(id);
    }
    async remove(id) {
        const customer = await this.findOne(id);
        if (customer) {
            await this.customerRepository.delete(id);
        }
        return customer;
    }
    async getCustomerDetail(id) {
        return await this.findOne(id);
    }
    async generateNavigationUrl(customerIds) {
        const customers = await this.customerRepository.findByIds(customerIds);
        if (customers.length === 0) {
            throw new common_1.NotFoundException('未找到有效的客户地址');
        }
        const addresses = customers.map(customer => customer.customerAddress).filter(Boolean);
        if (addresses.length === 0) {
            throw new common_1.NotFoundException('未找到有效的客户地址信息');
        }
        return addresses.join(' -> ');
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CustomersService);
//# sourceMappingURL=customers.service.js.map