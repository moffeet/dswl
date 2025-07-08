import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}





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