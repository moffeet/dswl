import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { WxUser } from './entities/wx-user.entity';
import { CreateWxUserDto } from './dto/create-wx-user.dto';
import { UpdateWxUserDto } from './dto/update-wx-user.dto';
import { WxUserQueryDto } from './dto/wx-user-query.dto';

@Injectable()
export class WxUsersService {
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
}
