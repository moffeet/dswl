import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from '../common/dto/pagination.dto';
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

    // 生成密码：如果未提供密码，则自动生成（手机后4位 + asdf）
    let password = createUserDto.password;
    if (!password) {
      if (!createUserDto.phone || createUserDto.phone.length < 4) {
        throw new ConflictException('未提供密码时，手机号必须提供且长度不少于4位');
      }
      const phoneLast4 = createUserDto.phone.slice(-4);
      password = phoneLast4 + 'asdf';
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      status: createUserDto.status || 'normal'
    });

    const savedUser = await this.userRepository.save(user);

    // 分配角色
    if (createUserDto.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: createUserDto.roleId }
      });
      if (role) {
        savedUser.roles = [role];
        await this.userRepository.save(savedUser);
      }
    } else {
      // 如果没有指定角色，分配默认的普通用户角色
      const defaultRole = await this.roleRepository.findOne({
        where: { roleCode: 'normal' }
      });
      if (defaultRole) {
        savedUser.roles = [defaultRole];
        await this.userRepository.save(savedUser);
      }
    }

    return await this.findOne(savedUser.id);
  }

  async findAll(searchDto: UserQueryDto): Promise<{ users: User[], total: number }> {
    const { page = 1, limit = 10, ...filters } = searchDto;
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
      skip: (page - 1) * limit,
      take: limit,
      order: { createTime: 'DESC' }
    });

    return { users, total };
  }

  async findOne(id: number): Promise<User> {
    if (!id || typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw new NotFoundException('无效的用户ID');
    }

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
      where: { username },
      relations: ['roles']
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

    // 移除roleId字段，避免尝试更新不存在的数据库字段
    const { roleId, ...updateData } = updateUserDto;

    await this.userRepository.update(id, updateData);

    // 更新角色
    if (roleId !== undefined) {
      try {
        const updatedUser = await this.userRepository.findOne({
          where: { id },
          relations: ['roles']
        });

        if (!updatedUser) {
          throw new NotFoundException('更新后的用户不存在');
        }

        if (roleId) {
          const role = await this.roleRepository.findOne({
            where: { id: roleId }
          });
          if (role) {
            updatedUser.roles = [role];
          }
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

  async removeMultiple(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new ConflictException('请提供要删除的用户ID');
    }

    // 检查所有用户是否存在
    const users = await this.userRepository.find({
      where: { id: In(ids) }
    });

    if (users.length !== ids.length) {
      throw new NotFoundException('部分用户不存在');
    }

    // 批量删除
    await this.userRepository.remove(users);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }



  async updateLoginInfo(userId: number, updateData: { 
    lastLoginTime?: Date; 
    lastLoginIp?: string;
    currentLoginIp?: string | null;
    currentToken?: string | null;
  }): Promise<void> {
    // 过滤掉 undefined 值，但保留 null 值用于清空字段
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(filteredData).length > 0) {
      await this.userRepository.update(userId, filteredData);
    }
  }
} 