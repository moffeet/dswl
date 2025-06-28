import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto, CustomerSearchResultDto } from './dto/search-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // 生成客户编号 - 获取最后一个客户的ID
    const lastCustomer = await this.customerRepository
      .createQueryBuilder('customer')
      .orderBy('customer.id', 'DESC')
      .getOne();
    
    const nextNumber = lastCustomer ? lastCustomer.id + 1 : 1;
    const customerNumber = `C${String(nextNumber).padStart(3, '0')}`;

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      customerNumber,
      updateBy: '管理员', // 设置更新人
    });

    return await this.customerRepository.save(customer);
  }

  async findAll(page: number = 1, limit: number = 10) {
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

  async search(searchDto: SearchCustomerDto) {
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

    // 添加分页支持
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

  async findOne(id: number): Promise<Customer> {
    return await this.customerRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    await this.customerRepository.update(id, updateCustomerDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<Customer> {
    const customer = await this.findOne(id);
    if (customer) {
      await this.customerRepository.delete(id);
    }
    return customer;
  }

  async getCustomerDetail(id: number): Promise<Customer> {
    return await this.findOne(id);
  }

  async generateNavigationUrl(customerIds: number[]): Promise<string> {
    const customers = await this.customerRepository.findByIds(customerIds);
    
    if (customers.length === 0) {
      throw new NotFoundException('未找到有效的客户地址');
    }

    // 由于当前客户表没有经纬度信息，返回地址信息用于导航
    const addresses = customers.map(customer => customer.customerAddress).filter(Boolean);
    
    if (addresses.length === 0) {
      throw new NotFoundException('未找到有效的客户地址信息');
    }

    // 返回地址列表，前端可以用于地图导航
    return addresses.join(' -> ');
  }
} 