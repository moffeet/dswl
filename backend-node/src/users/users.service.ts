import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { User, UserType, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, phone, email, password, ...userData } = createUserDto;

    // 检查用户名是否已存在
    const existingUserByUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUserByUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查手机号是否已存在
    const existingUserByPhone = await this.userRepository.findOne({
      where: { phone },
    });
    if (existingUserByPhone) {
      throw new ConflictException('手机号已存在');
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUserByEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 生成司机编号（如果是司机类型）
    let driverCode = userData.driverCode;
    if (createUserDto.userType === UserType.DRIVER && !driverCode) {
      driverCode = await this.generateDriverCode();
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = this.userRepository.create({
      ...userData,
      username,
      phone,
      email,
      password: hashedPassword,
      driverCode,
      status: createUserDto.status || UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password;
    return savedUser;
  }

  async findAllWithPagination(searchDto: SearchUserDto) {
    const { page = 1, pageSize = 10, username, realName, phone, email, userType } = searchDto;
    
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    
    // 添加搜索条件
    if (username) {
      queryBuilder.andWhere('user.username LIKE :username', { username: `%${username}%` });
    }
    if (realName) {
      queryBuilder.andWhere('user.realName LIKE :realName', { realName: `%${realName}%` });
    }
    if (phone) {
      queryBuilder.andWhere('user.phone LIKE :phone', { phone: `%${phone}%` });
    }
    if (email) {
      queryBuilder.andWhere('user.email LIKE :email', { email: `%${email}%` });
    }
    if (userType) {
      queryBuilder.andWhere('user.userType = :userType', { userType });
    }

    // 排序
    queryBuilder.orderBy('user.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 执行查询
    const [users, total] = await queryBuilder.getManyAndCount();

    // 移除密码字段
    users.forEach(user => delete user.password);

    return {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
    users.forEach(user => delete user.password);
    return users;
  }

  async findDrivers(): Promise<User[]> {
    const drivers = await this.userRepository.find({
      where: { userType: UserType.DRIVER },
      order: { createdAt: 'DESC' },
    });
    drivers.forEach(driver => delete driver.password);
    return drivers;
  }

  async getRoles() {
    return [
      {
        value: UserType.ADMIN,
        label: '管理员',
        description: '系统管理员，拥有所有权限',
        permissions: ['manage:all'],
      },
      {
        value: UserType.DRIVER,
        label: '司机',
        description: '配送司机，可以查看客户信息和提交打卡记录',
        permissions: ['read:customer', 'create:checkin', 'read:profile', 'update:profile'],
      },
      {
        value: UserType.SALES,
        label: '销售人员',
        description: '销售人员，可以管理客户信息',
        permissions: ['manage:customer', 'read:driver', 'read:checkin', 'read:profile', 'update:profile'],
      },
    ];
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    delete user.password;
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { phone },
    });
    if (user) {
      delete user.password;
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    const { password, username, phone, email, ...updateData } = updateUserDto;

    // 检查用户名冲突
    if (username && username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('用户名已存在');
      }
    }

    // 检查手机号冲突
    if (phone && phone !== user.phone) {
      const existingUser = await this.userRepository.findOne({
        where: { phone },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('手机号已存在');
      }
    }

    // 检查邮箱冲突
    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 更新用户信息
    Object.assign(user, { ...updateData, username, phone, email });

    // 如果提供了新密码，则加密并更新
    if (password) {
      user.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await this.userRepository.save(user);
    delete updatedUser.password;
    return updatedUser;
  }

  async batchRemove(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new NotFoundException('请提供要删除的用户ID');
    }

    const result = await this.userRepository.delete(ids);
    
    if (result.affected === 0) {
      throw new NotFoundException('没有找到要删除的用户');
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
  }

  async updateLastLoginAt(id: number): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async findByWechatOpenid(openid: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { wechatOpenid: openid },
    });
    return user;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async generateDriverCode(): Promise<string> {
    const prefix = 'D';
    let code: string;
    let exists = true;
    let counter = 1;

    while (exists) {
      code = `${prefix}${counter.toString().padStart(3, '0')}`;
      const existingDriver = await this.userRepository.findOne({
        where: { driverCode: code },
      });
      exists = !!existingDriver;
      counter++;
    }

    return code;
  }
} 