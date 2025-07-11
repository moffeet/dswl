import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionQueryDto } from '../common/dto/pagination.dto';

// 创建权限DTO
export interface CreatePermissionDto {
  permissionName: string;
  permissionCode: string;
  permissionType: 'menu' | 'button';
  parentId?: number;
  path?: string;
  component?: string;
  icon?: string;
  sortOrder: number;
  status?: 'normal' | 'disabled';
}

// 更新权限DTO
export interface UpdatePermissionDto {
  permissionName?: string;
  permissionCode?: string;
  permissionType?: 'menu' | 'button';
  parentId?: number;
  path?: string;
  component?: string;
  icon?: string;
  sortOrder?: number;
  status?: 'normal' | 'disabled';
}

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * 创建权限
   */
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // 检查权限编码是否已存在
    const existingPermission = await this.permissionRepository.findOne({
      where: { permissionCode: createPermissionDto.permissionCode }
    });
    if (existingPermission) {
      throw new ConflictException('权限编码已存在');
    }

    // 检查权限名称是否已存在
    const existingName = await this.permissionRepository.findOne({
      where: { permissionName: createPermissionDto.permissionName }
    });
    if (existingName) {
      throw new ConflictException('权限名称已存在');
    }

    // 如果指定了父级权限，检查父级权限是否存在
    if (createPermissionDto.parentId && createPermissionDto.parentId > 0) {
      const parentPermission = await this.permissionRepository.findOne({
        where: { id: createPermissionDto.parentId }
      });
      if (!parentPermission) {
        throw new BadRequestException('父级权限不存在');
      }
    }

    const permission = this.permissionRepository.create({
      ...createPermissionDto,
      parentId: createPermissionDto.parentId || 0,
      status: createPermissionDto.status || 'normal'
    });

    return await this.permissionRepository.save(permission);
  }

  /**
   * 分页查询权限列表
   */
  async findAll(queryDto: PermissionQueryDto): Promise<{ permissions: Permission[], total: number }> {
    const { page = 1, limit = 10, ...filters } = queryDto;
    const where: any = {};

    // 构建查询条件
    if (filters.permissionName) {
      where.permissionName = Like(`%${filters.permissionName}%`);
    }
    if (filters.permissionCode) {
      where.permissionCode = Like(`%${filters.permissionCode}%`);
    }
    if (filters.permissionType) {
      where.permissionType = filters.permissionType;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [permissions, total] = await this.permissionRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { sortOrder: 'ASC', createTime: 'DESC' }
    });

    return { permissions, total };
  }

  /**
   * 根据ID查找权限
   */
  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id }
    });
    if (!permission) {
      throw new NotFoundException('权限不存在');
    }
    return permission;
  }

  /**
   * 更新权限
   */
  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);

    // 如果要更新权限编码，检查是否与其他权限冲突
    if (updatePermissionDto.permissionCode && updatePermissionDto.permissionCode !== permission.permissionCode) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { permissionCode: updatePermissionDto.permissionCode }
      });
      if (existingPermission) {
        throw new ConflictException('权限编码已存在');
      }
    }

    // 如果要更新权限名称，检查是否与其他权限冲突
    if (updatePermissionDto.permissionName && updatePermissionDto.permissionName !== permission.permissionName) {
      const existingName = await this.permissionRepository.findOne({
        where: { permissionName: updatePermissionDto.permissionName }
      });
      if (existingName) {
        throw new ConflictException('权限名称已存在');
      }
    }

    // 如果指定了父级权限，检查父级权限是否存在
    if (updatePermissionDto.parentId && updatePermissionDto.parentId > 0) {
      const parentPermission = await this.permissionRepository.findOne({
        where: { id: updatePermissionDto.parentId }
      });
      if (!parentPermission) {
        throw new BadRequestException('父级权限不存在');
      }
    }

    await this.permissionRepository.update(id, updatePermissionDto);
    return await this.findOne(id);
  }

  /**
   * 删除权限
   */
  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);

    // 检查是否有子权限
    const childPermissions = await this.permissionRepository.find({
      where: { parentId: id }
    });
    if (childPermissions.length > 0) {
      throw new BadRequestException('该权限下还有子权限，无法删除');
    }

    // 检查是否有角色在使用该权限
    const rolePermissionCount = await this.permissionRepository.manager.query(
      'SELECT COUNT(*) as count FROM t_role_permissions WHERE permission_id = ?',
      [id]
    );

    if (rolePermissionCount[0]?.count > 0) {
      throw new BadRequestException('该权限正在被角色使用，无法删除');
    }

    await this.permissionRepository.remove(permission);
  }





  async findMenuTree(): Promise<Permission[]> {
    // 获取所有菜单权限
    const menuPermissions = await this.permissionRepository.find({
      where: { permissionType: 'menu', status: 'normal' },
      order: { sortOrder: 'ASC' }
    });

    // 构建树形结构
    return this.buildTree(menuPermissions);
  }

  async findButtonPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { permissionType: 'button', status: 'normal' },
      order: { sortOrder: 'ASC' }
    });
  }

  async findButtonTree(): Promise<Permission[]> {
    // 获取所有按钮权限
    const buttonPermissions = await this.permissionRepository.find({
      where: { permissionType: 'button', status: 'normal' },
      order: { sortOrder: 'ASC' }
    });

    // 构建树形结构
    return this.buildTree(buttonPermissions);
  }

  async findCompletePermissionTree(): Promise<Permission[]> {
    // 获取所有权限（菜单权限和按钮权限）
    const allPermissions = await this.permissionRepository.find({
      where: { status: 'normal' },
      order: { sortOrder: 'ASC' }
    });

    // 构建完整的权限树（包含菜单和按钮）
    return this.buildTree(allPermissions);
  }



  private buildTree(permissions: Permission[], parentId: number | string = 0): Permission[] {
    const result: Permission[] = [];
    
    for (const permission of permissions) {
      // 处理 parentId 可能是字符串或数字的情况
      const permParentId = typeof permission.parentId === 'string' ? parseInt(permission.parentId) : permission.parentId;
      const targetParentId = typeof parentId === 'string' ? parseInt(parentId) : parentId;
      
      if (permParentId === targetParentId) {
        const children = this.buildTree(permissions, permission.id);
        const node = { ...permission, children: children.length > 0 ? children : undefined };
        result.push(node);
      }
    }
    
    return result;
  }
} 