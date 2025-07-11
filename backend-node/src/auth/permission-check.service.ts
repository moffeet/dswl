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

    // home页面所有用户都可以访问
    if (path === '/' || path === '/home' || path === '') {
      return true;
    }

    // 页面路径与权限代码的映射（修复路径不匹配问题）
    const pagePermissionMap: { [key: string]: string } = {
      '/users': 'menu.users',
      '/roles': 'menu.roles',
      '/customer': 'menu.customer',  // 修复：数据库中是 /customer 不是 /customers
      '/receipts': 'menu.receipts',
      '/wx-user': 'menu.wxuser',
      '/map': 'menu.map'
    };

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
   * 获取用户可访问的菜单列表（支持层级结构）
   */
  async getUserMenus(userId: number): Promise<Array<any>> {
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

    // 从数据库获取所有菜单权限（包括层级结构）
    const allMenuPermissions = await this.permissionRepository.find({
      where: { permissionType: 'menu', status: 'normal' },
      order: { sortOrder: 'ASC' }
    });

    // 构建菜单树
    const buildMenuTree = (permissions: any[], parentId: number | null = null, visited: Set<number> = new Set()) => {
      const result: any[] = [];

      for (const permission of permissions) {
        // 防止无限递归
        if (visited.has(permission.id)) {
          continue;
        }

        let permParentId = permission.parentId;
        if (typeof permParentId === 'string') {
          permParentId = parseInt(permParentId);
        }

        // 处理顶级菜单：parentId 为 null、0 或 undefined 都视为顶级菜单
        const isTopLevel = permParentId === null || permParentId === 0 || permParentId === undefined;
        const isTargetParent = parentId === null ? isTopLevel : permParentId === parentId;

        if (isTargetParent) {
          // 检查权限
          const hasPermission = isAdmin ||
            permission.permissionCode === 'menu.home' ||
            permissionInfo.permissions.includes(permission.permissionCode);

          if (hasPermission) {
            // 标记为已访问
            visited.add(permission.id);

            const menuItem: any = {
              name: permission.permissionName,
              path: permission.path || `/${permission.permissionCode.replace('menu.', '')}`,
              code: permission.permissionCode,
              icon: permission.icon,
              sortOrder: permission.sortOrder
            };

            // 递归获取子菜单
            const children = buildMenuTree(permissions, permission.id, new Set(visited));
            if (children.length > 0) {
              menuItem.children = children;
            }

            result.push(menuItem);
          }
        }
      }

      return result.sort((a, b) => a.sortOrder - b.sortOrder);
    };

    // 添加首页菜单（如果不存在）
    const homeMenu = allMenuPermissions.find(p => p.permissionCode === 'menu.home');
    if (!homeMenu) {
      const homePermission = new Permission();
      homePermission.id = -1; // 使用负数ID避免与真实菜单冲突
      homePermission.permissionName = '首页';
      homePermission.permissionCode = 'menu.home';
      homePermission.permissionType = 'menu';
      homePermission.parentId = null; // 首页没有父菜单
      homePermission.path = '/';
      homePermission.icon = 'IconHome';
      homePermission.sortOrder = 0;
      homePermission.status = 'normal';
      homePermission.createTime = new Date();
      homePermission.updateTime = new Date();

      allMenuPermissions.unshift(homePermission);
    }

    return buildMenuTree(allMenuPermissions);
  }
}
