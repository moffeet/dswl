import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionQueryDto } from '../common/dto/pagination.dto';

export interface CreatePermissionDto {
  permissionName: string;
  permissionCode: string;
  permissionType: 'menu' | 'button';
  parentId?: number;
  path?: string;
  component?: string;
  icon?: string;
  sortOrder?: number;
  status?: 'normal' | 'disabled';
}

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

export interface SearchPermissionDto {
  permissionName?: string;
  permissionCode?: string;
  permissionType?: 'menu' | 'button';
  status?: 'normal' | 'disabled';
  page?: number;
  size?: number;
}

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // 检查权限编码是否已存在
    const existingPermission = await this.permissionRepository.findOne({
      where: { permissionCode: createPermissionDto.permissionCode }
    });
    if (existingPermission) {
      throw new ConflictException('权限编码已存在');
    }

    const permission = this.permissionRepository.create({
      ...createPermissionDto,
      parentId: createPermissionDto.parentId || 0,
      sortOrder: createPermissionDto.sortOrder || 0,
      status: createPermissionDto.status || 'normal'
    });

    return await this.permissionRepository.save(permission);
  }

  async findAll(searchDto: PermissionQueryDto): Promise<{ permissions: Permission[], total: number }> {
    const { page = 1, limit = 10, ...filters } = searchDto;
    const where: any = {};

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

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id }
    });
    if (!permission) {
      throw new NotFoundException('权限不存在');
    }
    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);

    // 检查权限编码是否已存在（排除当前权限）
    if (updatePermissionDto.permissionCode && updatePermissionDto.permissionCode !== permission.permissionCode) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { permissionCode: updatePermissionDto.permissionCode }
      });
      if (existingPermission) {
        throw new ConflictException('权限编码已存在');
      }
    }

    await this.permissionRepository.update(id, updatePermissionDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    
    // 检查是否有子权限
    const children = await this.permissionRepository.find({
      where: { parentId: id }
    });
    if (children.length > 0) {
      throw new ConflictException('存在子权限，无法删除');
    }

    await this.permissionRepository.remove(permission);
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