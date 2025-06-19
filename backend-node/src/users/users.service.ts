import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 检查手机号是否已存在
    const existingPhone = await this.usersRepository.findOne({
      where: { phone: createUserDto.phone },
    });
    if (existingPhone) {
      throw new ConflictException('手机号已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 创建用户
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'realName', 'phone', 'userType', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'username', 'realName', 'phone', 'userType', 'status', 'avatar', 'driverCode', 'lastLoginAt', 'createdAt'],
    });
    
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async findByWechatOpenid(openid: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { wechatOpenid: openid },
      select: ['id', 'username', 'realName', 'phone', 'userType', 'status', 'wechatOpenid'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    // 如果更新密码，需要加密
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 检查用户名冲突（如果要更新用户名）
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.usersRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser) {
        throw new ConflictException('用户名已存在');
      }
    }

    // 检查手机号冲突（如果要更新手机号）
    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingPhone = await this.usersRepository.findOne({
        where: { phone: updateUserDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('手机号已存在');
      }
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async updateLastLoginAt(id: number): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async bindWechatOpenid(id: number, openid: string): Promise<User> {
    await this.usersRepository.update(id, {
      wechatOpenid: openid,
    });
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async findDrivers(): Promise<User[]> {
    return this.usersRepository.find({
      where: { userType: UserType.DRIVER, status: UserStatus.ACTIVE },
      select: ['id', 'username', 'realName', 'phone', 'driverCode'],
      order: { createdAt: 'DESC' },
    });
  }
} 