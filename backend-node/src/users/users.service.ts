import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username }
    });
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 检查手机号是否已存在
    if (createUserDto.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: createUserDto.phone }
      });
      if (existingPhone) {
        throw new ConflictException('手机号已存在');
      }
    }

    // 检查邮箱是否已存在
    if (createUserDto.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email }
      });
      if (existingEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      status: createUserDto.status || 'normal'
    });

    const savedUser = await this.userRepository.save(user);

    // 分配角色
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      const roles = await this.roleRepository.find({
        where: { id: In(createUserDto.roleIds) }
      });
      savedUser.roles = roles;
      await this.userRepository.save(savedUser);
    }

    return await this.findOne(savedUser.id);
  }

  async findAll(searchDto: SearchUserDto): Promise<{ users: User[], total: number }> {
    const { page = 1, size = 10, ...filters } = searchDto;
    const where: any = {};

    if (filters.username) {
      where.username = Like(`%${filters.username}%`);
    }
    if (filters.nickname) {
      where.nickname = Like(`%${filters.nickname}%`);
    }
    if (filters.phone) {
      where.phone = Like(`%${filters.phone}%`);
    }
    if (filters.email) {
      where.email = Like(`%${filters.email}%`);
    }
    if (filters.gender) {
      where.gender = filters.gender;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [users, total] = await this.userRepository.findAndCount({
      where,
      relations: ['roles'],
      skip: (page - 1) * size,
      take: size,
      order: { createTime: 'DESC' }
    });

    return { users, total };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles']
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username }
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // 检查用户名是否已存在（排除当前用户）
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username }
      });
      if (existingUser) {
        throw new ConflictException('用户名已存在');
      }
    }

    // 检查手机号是否已存在（排除当前用户）
    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: updateUserDto.phone }
      });
      if (existingPhone) {
        throw new ConflictException('手机号已存在');
      }
    }

    // 检查邮箱是否已存在（排除当前用户）
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });
      if (existingEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 如果更新密码，需要加密
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    // 移除roleIds字段，避免尝试更新不存在的数据库字段
    const { roleIds, ...updateData } = updateUserDto;

    await this.userRepository.update(id, updateData);

    // 更新角色
    if (roleIds !== undefined) {
      try {
        const updatedUser = await this.userRepository.findOne({
          where: { id },
          relations: ['roles']
        });
        
        if (!updatedUser) {
          throw new NotFoundException('更新后的用户不存在');
        }
        
        if (roleIds.length > 0) {
          const roles = await this.roleRepository.find({
            where: { id: In(roleIds) }
          });
          updatedUser.roles = roles;
        } else {
          updatedUser.roles = [];
        }
        
        await this.userRepository.save(updatedUser);
      } catch (error) {
        console.error('角色更新失败:', error);
        // 如果角色更新失败，不影响基本信息更新
      }
    }

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async findByWechatOpenid(openid: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { wechatOpenid: openid },
      relations: ['roles']
    });
  }

  async createWechatUser(openid: string): Promise<User> {
    const user = this.userRepository.create({
      username: `wx_${openid.slice(-8)}`, // 使用openid后8位作为用户名
      password: '', // 微信用户不需要密码
      nickname: '微信用户',
      wechatOpenid: openid,
      status: 'normal'
    });

    return await this.userRepository.save(user);
  }

  async updateLoginInfo(userId: number, updateData: { lastLoginTime?: Date; lastLoginIp?: string }): Promise<void> {
    await this.userRepository.update(userId, updateData);
  }
} 