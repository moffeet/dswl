import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { Receipt } from './entities/receipt.entity';
import { WxUser } from '../wx-users/entities/wx-user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { ReceiptQueryDto } from './dto/receipt-query.dto';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { CustomLogger } from '../config/logger.config';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReceiptsService {
  private readonly logger = new CustomLogger('ReceiptsService');

  constructor(
    @InjectRepository(Receipt)
    private receiptRepository: Repository<Receipt>,
    @InjectRepository(WxUser)
    private wxUserRepository: Repository<WxUser>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  /**
   * 创建签收单
   */
  async create(createReceiptDto: CreateReceiptDto): Promise<Receipt> {
    try {
      this.logger.log(`创建签收单 - 数据: ${JSON.stringify(createReceiptDto)}`);

      // 验证小程序用户是否存在
      const wxUser = await this.wxUserRepository.findOne({
        where: { id: createReceiptDto.wxUserId, isDeleted: 0 }
      });

      if (!wxUser) {
        throw new NotFoundException('小程序用户不存在');
      }

      // 如果提供了客户ID，验证客户是否存在
      if (createReceiptDto.customerId) {
        const customer = await this.customerRepository.findOne({
          where: { id: createReceiptDto.customerId, isDeleted: 0 }
        });

        if (!customer) {
          this.logger.warn(`客户ID ${createReceiptDto.customerId} 不存在，但仍允许创建签收单`);
        }
      }

      const receipt = this.receiptRepository.create({
        ...createReceiptDto,
        uploadTime: createReceiptDto.uploadTime || new Date()
      });

      const savedReceipt = await this.receiptRepository.save(receipt);
      this.logger.log(`签收单创建成功 - ID: ${savedReceipt.id}`);

      return savedReceipt;
    } catch (error) {
      this.logger.error(`创建签收单失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 小程序用户上传签收单
   */
  async uploadReceipt(uploadDto: UploadReceiptDto, file: Express.Multer.File, baseUrl: string): Promise<Receipt> {
    try {
      this.logger.log(`小程序用户上传签收单 - 微信ID: ${uploadDto.wechatId}, MAC: ${uploadDto.macAddress}`);

      // 验证小程序用户
      const wxUser = await this.wxUserRepository.findOne({
        where: { 
          wechatId: uploadDto.wechatId,
          macAddress: uploadDto.macAddress,
          isDeleted: 0 
        }
      });

      if (!wxUser) {
        throw new ForbiddenException('用户验证失败，请重新登录');
      }

      // 检查用户角色是否为司机
      if (wxUser.role !== '司机') {
        throw new ForbiddenException('只有司机角色才能上传签收单');
      }

      if (!file) {
        throw new BadRequestException('请上传签收单图片');
      }

      // 生成文件路径
      const uploadDir = path.join('uploads', 'receipts', new Date().getFullYear().toString(), 
                                 String(new Date().getMonth() + 1).padStart(2, '0'),
                                 String(new Date().getDate()).padStart(2, '0'));
      
      // 确保目录存在
      const fullUploadDir = path.join(process.cwd(), uploadDir);
      if (!fs.existsSync(fullUploadDir)) {
        fs.mkdirSync(fullUploadDir, { recursive: true });
      }

      // 生成唯一文件名
      const fileExt = path.extname(file.originalname);
      const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);
      const fullFilePath = path.join(process.cwd(), filePath);

      // 保存文件
      fs.writeFileSync(fullFilePath, file.buffer);

      // 生成访问URL
      const imageUrl = `${baseUrl}/${filePath.replace(/\\/g, '/')}`;

      // 创建签收单记录
      const createDto: CreateReceiptDto = {
        wxUserId: wxUser.id,
        wxUserName: wxUser.name,
        customerId: uploadDto.customerId,
        customerName: uploadDto.customerName,
        customerAddress: uploadDto.customerAddress,
        uploadLocation: uploadDto.uploadLocation,
        uploadLongitude: uploadDto.uploadLongitude,
        uploadLatitude: uploadDto.uploadLatitude,
        imagePath: filePath,
        imageUrl: imageUrl,
        uploadTime: new Date()
      };

      const receipt = await this.create(createDto);
      this.logger.log(`签收单上传成功 - ID: ${receipt.id}, 用户: ${wxUser.name}`);

      return receipt;
    } catch (error) {
      this.logger.error(`上传签收单失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 查询签收单列表（分页）
   */
  async findAll(queryDto: ReceiptQueryDto) {
    try {
      this.logger.log(`查询签收单列表 - 参数: ${JSON.stringify(queryDto)}`);

      const { page = 1, limit = 10, search, customerName, startTime, endTime, sortBy = 'uploadTime', sortOrder = 'DESC' } = queryDto;
      
      const queryBuilder = this.receiptRepository
        .createQueryBuilder('receipt')
        .leftJoinAndSelect('receipt.wxUser', 'wxUser')
        .leftJoinAndSelect('receipt.customer', 'customer')
        .where('receipt.isDeleted = :isDeleted', { isDeleted: 0 });

      // 搜索条件：上传人姓名
      if (search) {
        queryBuilder.andWhere('receipt.wxUserName LIKE :search', { search: `%${search}%` });
      }

      // 搜索条件：客户名称
      if (customerName) {
        queryBuilder.andWhere('receipt.customerName LIKE :customerName', { customerName: `%${customerName}%` });
      }

      // 时间范围查询
      if (startTime && endTime) {
        queryBuilder.andWhere('receipt.uploadTime BETWEEN :startTime AND :endTime', {
          startTime: new Date(startTime),
          endTime: new Date(endTime)
        });
      } else if (startTime) {
        queryBuilder.andWhere('receipt.uploadTime >= :startTime', { startTime: new Date(startTime) });
      } else if (endTime) {
        queryBuilder.andWhere('receipt.uploadTime <= :endTime', { endTime: new Date(endTime) });
      }

      // 排序
      const validSortFields = ['uploadTime', 'createTime', 'wxUserName', 'customerName'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'uploadTime';
      queryBuilder.orderBy(`receipt.${sortField}`, sortOrder);

      // 分页
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      const [receipts, total] = await queryBuilder.getManyAndCount();

      this.logger.log(`查询签收单列表成功 - 总数: ${total}, 当前页: ${page}, 每页: ${limit}`);

      return {
        receipts,
        total,
        page,
        limit
      };
    } catch (error) {
      this.logger.error(`查询签收单列表失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 根据ID查询签收单详情
   */
  async findOne(id: number): Promise<Receipt> {
    try {
      this.logger.log(`查询签收单详情 - ID: ${id}`);

      if (!id || typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
        throw new BadRequestException('无效的签收单ID');
      }

      const receipt = await this.receiptRepository.findOne({
        where: { id, isDeleted: 0 },
        relations: ['wxUser', 'customer']
      });

      if (!receipt) {
        throw new NotFoundException('签收单不存在');
      }

      this.logger.log(`查询签收单详情成功 - ID: ${id}`);
      return receipt;
    } catch (error) {
      this.logger.error(`查询签收单详情失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新签收单
   */
  async update(id: number, updateReceiptDto: UpdateReceiptDto): Promise<Receipt> {
    try {
      this.logger.log(`更新签收单 - ID: ${id}, 数据: ${JSON.stringify(updateReceiptDto)}`);

      const receipt = await this.findOne(id);
      
      await this.receiptRepository.update(id, updateReceiptDto);
      const updatedReceipt = await this.findOne(id);

      this.logger.log(`更新签收单成功 - ID: ${id}`);
      return updatedReceipt;
    } catch (error) {
      this.logger.error(`更新签收单失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 删除签收单（软删除）
   */
  async remove(id: number): Promise<Receipt> {
    try {
      this.logger.log(`删除签收单 - ID: ${id}`);

      const receipt = await this.findOne(id);

      // 软删除
      await this.receiptRepository.update(id, { isDeleted: 1 });

      this.logger.log(`删除签收单成功 - ID: ${id}`);
      return receipt;
    } catch (error) {
      this.logger.error(`删除签收单失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量删除签收单
   */
  async batchRemove(ids: number[]): Promise<{ deletedCount: number }> {
    try {
      this.logger.log(`批量删除签收单 - IDs: ${JSON.stringify(ids)}`);

      if (!ids || ids.length === 0) {
        throw new BadRequestException('请选择要删除的签收单');
      }

      // 验证所有ID都存在
      const receipts = await this.receiptRepository.find({
        where: { id: In(ids), isDeleted: 0 }
      });

      if (receipts.length !== ids.length) {
        throw new BadRequestException('部分签收单不存在或已被删除');
      }

      // 批量软删除
      await this.receiptRepository.update(ids, { isDeleted: 1 });

      this.logger.log(`批量删除签收单成功 - 删除数量: ${ids.length}`);
      return { deletedCount: ids.length };
    } catch (error) {
      this.logger.error(`批量删除签收单失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 定时清理3个月前的签收单（硬删除）
   */
  async cleanupOldReceipts(): Promise<{ deletedCount: number }> {
    try {
      this.logger.log('开始清理3个月前的签收单');

      // 计算3个月前的日期
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // 查找需要删除的记录
      const oldReceipts = await this.receiptRepository.find({
        where: {
          uploadTime: Between(new Date('1970-01-01'), threeMonthsAgo)
        }
      });

      if (oldReceipts.length === 0) {
        this.logger.log('没有需要清理的签收单');
        return { deletedCount: 0 };
      }

      // 删除对应的图片文件
      for (const receipt of oldReceipts) {
        try {
          const fullFilePath = path.join(process.cwd(), receipt.imagePath);
          if (fs.existsSync(fullFilePath)) {
            fs.unlinkSync(fullFilePath);
            this.logger.log(`删除图片文件: ${receipt.imagePath}`);
          }
        } catch (fileError) {
          this.logger.warn(`删除图片文件失败: ${receipt.imagePath}, 错误: ${fileError.message}`);
        }
      }

      // 硬删除数据库记录
      await this.receiptRepository.delete({
        uploadTime: Between(new Date('1970-01-01'), threeMonthsAgo)
      });

      this.logger.log(`清理签收单完成 - 删除数量: ${oldReceipts.length}`);
      return { deletedCount: oldReceipts.length };
    } catch (error) {
      this.logger.error(`清理签收单失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
