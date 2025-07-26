import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WxUser } from './entities/wx-user.entity';
import { CreateWxUserDto } from './dto/create-wx-user.dto';
import { UpdateWxUserDto } from './dto/update-wx-user.dto';
import { WxUserQueryDto } from './dto/wx-user-query.dto';
import { CustomLogger } from '../config/logger.config';

@Injectable()
export class WxUsersService {
  private readonly logger = new CustomLogger('WxUsersService');

  constructor(
    @InjectRepository(WxUser)
    private wxUserRepository: Repository<WxUser>,
  ) {}

  async create(createWxUserDto: CreateWxUserDto): Promise<WxUser> {
    // 检查手机号是否已存在
    const existingUser = await this.wxUserRepository.findOne({
      where: { phone: createWxUserDto.phone, isDeleted: 0 }
    });
    if (existingUser) {
      throw new ConflictException('手机号已存在');
    }

    const wxUser = this.wxUserRepository.create(createWxUserDto);
    return await this.wxUserRepository.save(wxUser);
  }

  async findAll(queryDto: WxUserQueryDto): Promise<{ wxUsers: WxUser[], total: number }> {
    const { page = 1, limit = 10, name, phone, role, wechatId } = queryDto;
    
    const queryBuilder = this.wxUserRepository.createQueryBuilder('wxUser')
      .where('wxUser.isDeleted = :isDeleted', { isDeleted: 0 });

    // 添加搜索条件
    if (name) {
      queryBuilder.andWhere('wxUser.name LIKE :name', { name: `%${name}%` });
    }
    if (phone) {
      queryBuilder.andWhere('wxUser.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (role) {
      queryBuilder.andWhere('wxUser.role = :role', { role });
    }
    if (wechatId) {
      queryBuilder.andWhere('wxUser.wechatId LIKE :wechatId', { wechatId: `%${wechatId}%` });
    }

    // 排序：按更新时间倒序
    queryBuilder.orderBy('wxUser.updateTime', 'DESC');

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [wxUsers, total] = await queryBuilder.getManyAndCount();

    return { wxUsers, total };
  }

  async findOne(id: number): Promise<WxUser> {
    const wxUser = await this.wxUserRepository.findOne({
      where: { id, isDeleted: 0 }
    });
    if (!wxUser) {
      throw new NotFoundException('小程序用户不存在');
    }
    return wxUser;
  }

  async update(id: number, updateWxUserDto: UpdateWxUserDto): Promise<WxUser> {
    const wxUser = await this.findOne(id);

    // 如果更新手机号，检查是否与其他用户冲突
    if (updateWxUserDto.phone && updateWxUserDto.phone !== wxUser.phone) {
      const existingUser = await this.wxUserRepository.findOne({
        where: { phone: updateWxUserDto.phone, isDeleted: 0 }
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('手机号已存在');
      }
    }

    Object.assign(wxUser, updateWxUserDto);
    return await this.wxUserRepository.save(wxUser);
  }

  async remove(id: number, deletedBy?: number): Promise<void> {
    const wxUser = await this.findOne(id);

    // 软删除
    await this.wxUserRepository.update(id, {
      isDeleted: 1,
      updateBy: deletedBy
    });
  }

  /**
   * 通过微信openid查找用户
   */
  async findByWechatId(wechatId: string): Promise<WxUser | null> {
    const wxUser = await this.wxUserRepository.findOne({
      where: { wechatId, isDeleted: 0 }
    });
    return wxUser;
  }

  /**
   * 通过手机号查找用户
   */
  async findByPhone(phone: string): Promise<WxUser | null> {
    this.logger.log(`🔍 查找手机号用户 - 手机号: ${phone}`);
    const wxUser = await this.wxUserRepository.findOne({
      where: { phone, isDeleted: 0 }
    });

    if (wxUser) {
      this.logger.log(`✅ 找到用户 - ID: ${wxUser.id}, 姓名: ${wxUser.name}, 角色: ${wxUser.role}`);
    } else {
      this.logger.log(`❌ 未找到用户 - 手机号: ${phone}`);
    }

    return wxUser;
  }

  /**
   * 更新用户的微信ID和设备标识
   */
  async updateWechatInfo(id: number, wechatId: string, deviceId?: string): Promise<WxUser> {
    const updateData: any = { wechatId };

    if (deviceId) {
      updateData.deviceId = deviceId;
    }

    await this.wxUserRepository.update(id, updateData);
    return await this.findOne(id);
  }

  /**
   * 验证设备标识
   */
  async validateDeviceId(userId: number, deviceId: string): Promise<boolean> {
    this.logger.log(`🔒 验证设备标识 - 用户ID: ${userId}, 请求设备ID: ${deviceId}`);
    const user = await this.findOne(userId);

    // 如果数据库中没有设备标识，允许登录并更新
    if (!user.deviceId) {
      this.logger.log(`📝 用户无设备标识记录，更新并允许登录 - 用户ID: ${userId}, 设备ID: ${deviceId}`);
      await this.wxUserRepository.update(userId, { deviceId });
      return true;
    }

    // 如果设备标识不匹配，拒绝登录
    const isValid = user.deviceId === deviceId;
    if (isValid) {
      this.logger.log(`✅ 设备标识验证通过 - 用户ID: ${userId}`);
    } else {
      this.logger.error(`❌ 设备标识不匹配 - 用户ID: ${userId}, 数据库设备ID: ${user.deviceId}, 请求设备ID: ${deviceId}`);
    }

    return isValid;
  }

  /**
   * 重置用户设备绑定
   * 管理员功能：清除用户的设备绑定信息，用户需要重新登录
   */
  async resetDeviceBinding(userId: number): Promise<{
    userId: number;
    userName: string;
    phone: string;
    resetTime: string;
    previousDevice?: string;
  }> {
    this.logger.log(`🔄 开始重置设备绑定 - 用户ID: ${userId}`);

    const user = await this.findOne(userId);
    const previousDevice = user.deviceId;

    // 清除设备绑定信息
    await this.wxUserRepository.update(userId, {
      deviceId: null,
      updateBy: null // 可以传入管理员ID
    });

    this.logger.log(`✅ 设备绑定重置成功 - 用户ID: ${userId}, 姓名: ${user.name}, 原设备: ${previousDevice || '无'}`);

    return {
      userId: user.id,
      userName: user.name,
      phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // 脱敏处理
      resetTime: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      previousDevice
    };
  }
}
