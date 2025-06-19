import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    // 检查司机编号是否已存在
    const existingDriver = await this.driversRepository.findOne({
      where: { driverCode: createDriverDto.driverCode },
    });
    if (existingDriver) {
      throw new ConflictException('司机编号已存在');
    }

    // 检查用户是否已绑定司机
    const existingUserDriver = await this.driversRepository.findOne({
      where: { userId: createDriverDto.userId },
    });
    if (existingUserDriver) {
      throw new ConflictException('该用户已绑定司机信息');
    }

    const driver = this.driversRepository.create(createDriverDto);
    return this.driversRepository.save(driver);
  }

  async findAll(): Promise<Driver[]> {
    return this.driversRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Driver> {
    const driver = await this.driversRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException('司机不存在');
    }

    return driver;
  }

  async findByUserId(userId: number): Promise<Driver> {
    const driver = await this.driversRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!driver) {
      throw new NotFoundException('司机信息不存在');
    }

    return driver;
  }

  async update(id: number, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findById(id);

    // 如果更新司机编号，检查是否冲突
    if (updateDriverDto.driverCode && updateDriverDto.driverCode !== driver.driverCode) {
      const existingDriver = await this.driversRepository.findOne({
        where: { driverCode: updateDriverDto.driverCode },
      });
      if (existingDriver) {
        throw new ConflictException('司机编号已存在');
      }
    }

    await this.driversRepository.update(id, updateDriverDto);
    return this.findById(id);
  }

  async updateLocation(userId: number, updateLocationDto: UpdateLocationDto): Promise<Driver> {
    const driver = await this.findByUserId(userId);

    await this.driversRepository.update(driver.id, {
      currentLongitude: updateLocationDto.longitude,
      currentLatitude: updateLocationDto.latitude,
      lastLocationUpdateAt: new Date(),
    });

    return this.findById(driver.id);
  }

  async updateStatus(userId: number, status: DriverStatus): Promise<Driver> {
    const driver = await this.findByUserId(userId);

    await this.driversRepository.update(driver.id, { status });
    return this.findById(driver.id);
  }

  async remove(id: number): Promise<void> {
    const driver = await this.findById(id);
    await this.driversRepository.remove(driver);
  }

  async findActiveDrivers(): Promise<Driver[]> {
    return this.driversRepository.find({
      where: { 
        enabled: true,
        status: DriverStatus.AVAILABLE,
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDriverInfo(userId: number): Promise<Driver> {
    return this.findByUserId(userId);
  }
} 