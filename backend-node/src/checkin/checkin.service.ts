import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CheckinRecord } from './entities/checkin-record.entity';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { SearchCheckinDto } from './dto/search-checkin.dto';

@Injectable()
export class CheckinService {
  constructor(
    @InjectRepository(CheckinRecord)
    private checkinRepository: Repository<CheckinRecord>,
  ) {}

  async create(createCheckinDto: CreateCheckinDto, driverId: number): Promise<CheckinRecord> {
    const checkin = this.checkinRepository.create({
      ...createCheckinDto,
      driverId,
      checkinTime: new Date(),
    });

    return this.checkinRepository.save(checkin);
  }

  async findAll(searchDto: SearchCheckinDto): Promise<{
    data: CheckinRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { driverId, customerId, checkinType, startDate, endDate, page = 1, limit = 10 } = searchDto;
    const queryBuilder = this.checkinRepository.createQueryBuilder('checkin')
      .leftJoinAndSelect('checkin.driver', 'driver')
      .leftJoinAndSelect('checkin.customer', 'customer');

    // 按司机筛选
    if (driverId) {
      queryBuilder.andWhere('checkin.driverId = :driverId', { driverId });
    }

    // 按客户筛选
    if (customerId) {
      queryBuilder.andWhere('checkin.customerId = :customerId', { customerId });
    }

    // 按打卡类型筛选
    if (checkinType) {
      queryBuilder.andWhere('checkin.checkinType = :checkinType', { checkinType });
    }

    // 按日期范围筛选
    if (startDate && endDate) {
      queryBuilder.andWhere('checkin.checkinTime BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate + ' 23:59:59'),
      });
    } else if (startDate) {
      queryBuilder.andWhere('checkin.checkinTime >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
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

  async findById(id: number): Promise<CheckinRecord> {
    const checkin = await this.checkinRepository.findOne({
      where: { id },
      relations: ['driver', 'customer'],
    });

    if (!checkin) {
      throw new NotFoundException('打卡记录不存在');
    }

    return checkin;
  }

  async findByDriver(driverId: number, limit: number = 20): Promise<CheckinRecord[]> {
    return this.checkinRepository.find({
      where: { driverId },
      relations: ['customer'],
      order: { checkinTime: 'DESC' },
      take: limit,
    });
  }

  async remove(id: number): Promise<void> {
    const checkin = await this.findById(id);
    await this.checkinRepository.remove(checkin);
  }

  async getTodayCheckins(driverId: number): Promise<CheckinRecord[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.checkinRepository.find({
      where: {
        driverId,
        checkinTime: Between(startOfDay, endOfDay),
      },
      relations: ['customer'],
      order: { checkinTime: 'DESC' },
    });
  }

  async getCheckinStats(driverId?: number, startDate?: string, endDate?: string) {
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
} 