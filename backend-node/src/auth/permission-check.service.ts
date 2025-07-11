import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

export interface UserPermissionInfo {
  hasRole: boolean;
  roles: Role[];
  permissions: string[];
  canAccessPage: (path: string) => boolean;
  canPerformAction: (actionCode: string) => boolean;
}

@Injectable()
export class PermissionCheckService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * 获取用户权限信息
   */
  async getUserPermissionInfo(userId: number): Promise<UserPermissionInfo> {
    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: 0 }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 手动查询用户的角色信息
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('t_user_roles', 'ur', 'ur.role_id = role.id')
      .where('ur.user_id = :userId', { userId })
      .andWhere('role.is_deleted = 0')
      .getMany();

    // 检查用户是否有角色
    const hasRole = roles && roles.length > 0;

    // 检查是否为超级管理员
    const isAdmin = roles.some(role => role.roleCode === 'admin');

    // 获取用户的所有权限
    let permissions: string[] = [];
    if (hasRole) {
      if (isAdmin) {
        // 超级管理员拥有所有权限
        const { generateAllPermissions } = await import('../common/constants/permissions');
        const allPermissions = generateAllPermissions();
        permissions = allPermissions.map(p => p.code);
      } else {
        // 获取所有角色的权限
        const roleIds = roles.map(role => role.id);
        if (roleIds.length > 0) {
          const rolePermissions = await this.permissionRepository
            .createQueryBuilder('permission')
            .innerJoin('t_role_permissions', 'rp', 'rp.permission_id = permission.id')
            .where('rp.role_id IN (:...roleIds)', { roleIds })
            .andWhere('permission.status = :status', { status: 'normal' })
            .getMany();

          permissions = rolePermissions.map(p => p.permissionCode);
        }
      }
    }

    return {
      hasRole,
      roles,
      permissions,
      canAccessPage: (path: string) => this.canAccessPage(path, permissions, hasRole, isAdmin),
      canPerformAction: (actionCode: string) => isAdmin || permissions.includes(actionCode)
    };
  }

  /**
   * 检查用户是否可以访问指定页面
   */
  private canAccessPage(path: string, permissions: string[], hasRole: boolean, isAdmin: boolean = false): boolean {
    // 超级管理员可以访问所有页面
    if (isAdmin) {
      return true;
    }

    // 如果没有角色，只能访问home页面
    if (!hasRole) {
      return path === '/' || path === '/home' || path === '';
    }

    // 页面路径与权限代码的映射
    const pagePermissionMap: { [key: string]: string } = {
      '/users': 'menu.users',
      '/roles': 'menu.roles',
      '/customers': 'menu.customer',
      '/receipts': 'menu.receipts',
      '/wx-user': 'menu.wxuser',
      '/map': 'menu.map'
    };

    // home页面所有用户都可以访问
    if (path === '/' || path === '/home' || path === '') {
      return true;
    }

    // 检查是否有对应页面的权限
    const requiredPermission = pagePermissionMap[path];
    if (requiredPermission) {
      return permissions.includes(requiredPermission);
    }

    // 对于未定义的页面，有角色的用户可以访问
    return hasRole;
  }

  /**
   * 检查用户是否为超级管理员
   */
  async isAdmin(userId: number): Promise<boolean> {
    // 手动查询用户的角色信息
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('t_user_roles', 'ur', 'ur.role_id = role.id')
      .where('ur.user_id = :userId', { userId })
      .andWhere('role.is_deleted = 0')
      .getMany();

    if (!roles || roles.length === 0) {
      return false;
    }

    return roles.some(role => role.roleCode === 'admin');
  }

  /**
   * 获取用户可访问的菜单列表
   */
  async getUserMenus(userId: number): Promise<Array<{
    name: string;
    path: string;
    code: string;
    icon?: string;
    sortOrder: number;
  }>> {
    const permissionInfo = await this.getUserPermissionInfo(userId);

    // 检查是否为超级管理员
    const isAdmin = permissionInfo.roles.some(role => role.roleCode === 'admin');

    // 如果没有角色，只返回home菜单
    if (!permissionInfo.hasRole) {
      return [{
        name: '首页',
        path: '/',
        code: 'menu.home',
        icon: 'IconHome',
        sortOrder: 0
      }];
    }

    // 定义所有可能的菜单
    const allMenus = [
      {
        name: '首页',
        path: '/',
        code: 'menu.home',
        icon: 'IconHome',
        sortOrder: 0
      },
      {
        name: '用户管理',
        path: '/users',
        code: 'menu.users',
        icon: 'IconUser',
        sortOrder: 1
      },
      {
        name: '角色管理',
        path: '/roles',
        code: 'menu.roles',
        icon: 'IconUserGroup',
        sortOrder: 2
      },
      {
        name: '客户地址',
        path: '/customers',
        code: 'menu.customer',
        icon: 'IconLocation',
        sortOrder: 3
      },
      {
        name: '签收单',
        path: '/receipts',
        code: 'menu.receipts',
        icon: 'IconFileText',
        sortOrder: 4
      },
      {
        name: '小程序用户',
        path: '/wx-user',
        code: 'menu.wxuser',
        icon: 'IconMobile',
        sortOrder: 5
      },
      {
        name: '地图',
        path: '/map',
        code: 'menu.map',
        icon: 'IconMap',
        sortOrder: 6
      },
      {
        name: '权限管理',
        path: '/permissions',
        code: 'menu.permissions',
        icon: 'IconLock',
        sortOrder: 7
      }
    ];

    // 超级管理员可以访问所有菜单
    if (isAdmin) {
      return allMenus.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // 过滤用户有权限的菜单
    return allMenus.filter(menu => {
      if (menu.code === 'menu.home') {
        return true; // 首页所有人都可以访问
      }
      return permissionInfo.permissions.includes(menu.code);
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
