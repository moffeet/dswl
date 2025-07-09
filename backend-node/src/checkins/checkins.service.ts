import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { Checkin } from './entities/checkin.entity';
import { Customer } from '../customers/entities/customer.entity';
import { UploadCheckinDto } from './dto/upload-checkin.dto';
import { CheckinQueryDto } from './dto/checkin-query.dto';
import { CustomLogger } from '../config/logger.config';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class CheckinsService {
  private readonly logger = new CustomLogger('CheckinsService');

  constructor(
    @InjectRepository(Checkin)
    private checkinRepository: Repository<Checkin>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  /**
   * 小程序司机上传打卡
   */
  async uploadCheckin(uploadDto: UploadCheckinDto, file: Express.Multer.File, baseUrl: string): Promise<Checkin> {

    // 2. 查找客户信息（可选）
    let customer: Customer | null = null;
    if (uploadDto.customerName) {
      customer = await this.customerRepository.findOne({
        where: { 
          customerName: Like(`%${uploadDto.customerName}%`),
          isDeleted: 0 
        }
      });
    }

    // 3. 保存文件
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'checkins');
    const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
    const fullUploadDir = path.join(uploadDir, dateDir);

    // 确保目录存在
    if (!fs.existsSync(fullUploadDir)) {
      fs.mkdirSync(fullUploadDir, { recursive: true });
    }

    // 生成文件名
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `checkin_${timestamp}${ext}`;
    const filePath = path.join(fullUploadDir, filename);
    const relativePath = path.join('uploads', 'checkins', dateDir, filename).replace(/\\/g, '/');

    // 写入文件
    fs.writeFileSync(filePath, file.buffer);

    // 4. 构建图片URL
    const imageUrl = `${baseUrl}/${relativePath}`;

    // 5. 创建打卡记录
    const checkin = this.checkinRepository.create({
      wxUserId: null, // 不再关联具体用户ID
      wxUserName: uploadDto.wxUserName,
      customerId: customer?.id,
      customerName: uploadDto.customerName,
      customerAddress: uploadDto.customerAddress,
      checkinLocation: uploadDto.checkinLocation,
      checkinLongitude: uploadDto.checkinLongitude,
      checkinLatitude: uploadDto.checkinLatitude,
      imagePath: relativePath,
      imageUrl: imageUrl,
      checkinTime: new Date()
    });

    const savedCheckin = await this.checkinRepository.save(checkin);

    this.logger.log(`打卡成功 - 用户: ${uploadDto.wxUserName}, 客户: ${uploadDto.customerName}, ID: ${savedCheckin.id}`);

    return savedCheckin;
  }

  /**
   * 获取打卡列表（管理后台）
   */
  async findAll(queryDto: CheckinQueryDto) {
    const { page = 1, limit = 10, search, customerName, startTime, endTime, sortBy = 'checkinTime', sortOrder = 'DESC' } = queryDto;

    const queryBuilder = this.checkinRepository.createQueryBuilder('checkin')
      .leftJoinAndSelect('checkin.wxUser', 'wxUser')
      .leftJoinAndSelect('checkin.customer', 'customer')
      .where('checkin.isDeleted = :isDeleted', { isDeleted: 0 });

    // 搜索条件
    if (search) {
      queryBuilder.andWhere('checkin.wxUserName LIKE :search', { search: `%${search}%` });
    }

    if (customerName) {
      queryBuilder.andWhere('checkin.customerName LIKE :customerName', { customerName: `%${customerName}%` });
    }

    // 时间范围
    if (startTime && endTime) {
      queryBuilder.andWhere('checkin.checkinTime BETWEEN :startTime AND :endTime', {
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      });
    } else if (startTime) {
      queryBuilder.andWhere('checkin.checkinTime >= :startTime', { startTime: new Date(startTime) });
    } else if (endTime) {
      queryBuilder.andWhere('checkin.checkinTime <= :endTime', { endTime: new Date(endTime) });
    }

    // 排序
    queryBuilder.orderBy(`checkin.${sortBy}`, sortOrder);

    // 分页
    const [checkins, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      checkins,
      total,
      page,
      limit
    };
  }

  /**
   * 获取打卡详情
   */
  async findOne(id: number): Promise<Checkin> {
    const checkin = await this.checkinRepository.findOne({
      where: { id, isDeleted: 0 },
      relations: ['wxUser', 'customer']
    });

    if (!checkin) {
      throw new NotFoundException('打卡记录不存在');
    }

    return checkin;
  }

  /**
   * 删除打卡记录（软删除）
   */
  async remove(id: number): Promise<void> {
    const checkin = await this.findOne(id);
    
    await this.checkinRepository.update(id, {
      isDeleted: 1,
      updateTime: new Date()
    });

    this.logger.log(`删除打卡记录 - ID: ${id}`);
  }

  /**
   * 批量删除打卡记录
   */
  async batchRemove(ids: number[]): Promise<{ deletedCount: number }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请选择要删除的记录');
    }

    const result = await this.checkinRepository.update(
      { id: In(ids), isDeleted: 0 },
      { isDeleted: 1, updateTime: new Date() }
    );

    this.logger.log(`批量删除打卡记录 - IDs: ${JSON.stringify(ids)}, 删除数量: ${result.affected}`);

    return { deletedCount: result.affected || 0 };
  }

  /**
   * 清理3个月前的打卡记录
   */
  async cleanupOldCheckins(): Promise<{ deletedCount: number }> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // 获取要删除的记录
    const oldCheckins = await this.checkinRepository.find({
      where: {
        checkinTime: Between(new Date('1970-01-01'), threeMonthsAgo),
        isDeleted: 0
      }
    });

    if (oldCheckins.length === 0) {
      return { deletedCount: 0 };
    }

    // 删除图片文件
    for (const checkin of oldCheckins) {
      try {
        const filePath = path.join(process.cwd(), 'public', checkin.imagePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        this.logger.error(`删除图片文件失败: ${checkin.imagePath}`, error);
      }
    }

    // 硬删除数据库记录
    const result = await this.checkinRepository.delete({
      checkinTime: Between(new Date('1970-01-01'), threeMonthsAgo)
    });

    this.logger.log(`清理3个月前的打卡记录 - 删除数量: ${result.affected}`);

    return { deletedCount: result.affected || 0 };
  }
}
