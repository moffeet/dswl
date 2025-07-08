import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RoleQueryDto } from '../common/dto/pagination.dto';
import { PROTECTED_ROLES, isProtectedRole } from '../common/constants/permissions';

export interface CreateRoleDto {
  roleName: string;
  roleCode: string;
  description?: string;
  permissionCodes?: string[]; // 改为权限代码数组，简化权限配置
}

export interface UpdateRoleDto {
  description?: string; // 只允许修改描述
  permissionCodes?: string[]; // 改为权限代码数组
}



@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // 检查角色编码是否已存在
    const existingRole = await this.roleRepository.findOne({
      where: { roleCode: createRoleDto.roleCode }
    });
    if (existingRole) {
      throw new ConflictException('角色编码已存在');
    }

    // 检查角色名是否已存在
    const existingRoleName = await this.roleRepository.findOne({
      where: { roleName: createRoleDto.roleName }
    });
    if (existingRoleName) {
      throw new ConflictException('角色名称已存在');
    }

    // 检查角色数量限制（最多100个）
    const roleCount = await this.roleRepository.count();
    if (roleCount >= 100) {
      throw new BadRequestException('角色数量已达到上限（100个）');
    }

    const role = this.roleRepository.create({
      roleName: createRoleDto.roleName,
      roleCode: createRoleDto.roleCode,
      description: createRoleDto.description,
      status: 'enabled' // 固定为启用状态
    });

    const savedRole = await this.roleRepository.save(role);

    // 如果提供了权限代码，分配权限
    if (createRoleDto.permissionCodes && createRoleDto.permissionCodes.length > 0) {
      await this.assignPermissionsByCodes(savedRole.id, createRoleDto.permissionCodes);
    }

    return await this.findOne(savedRole.id);
  }

  async findAll(searchDto: RoleQueryDto): Promise<{ roles: Role[], total: number }> {
    const { page = 1, limit = 10, ...filters } = searchDto;
    const where: any = { isDeleted: 0 }; // 只查询未删除的角色

    if (filters.roleName) {
      where.roleName = Like(`%${filters.roleName}%`);
    }
    if (filters.roleCode) {
      where.roleCode = Like(`%${filters.roleCode}%`);
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.miniAppLoginEnabled !== undefined) {
      where.miniAppLoginEnabled = filters.miniAppLoginEnabled;
    }

    const [roles, total] = await this.roleRepository.findAndCount({
      where,
      relations: ['permissions'], // 启用权限关系
      skip: (page - 1) * limit,
      take: limit,
      order: { createTime: 'DESC' }
    });

    // 为每个角色添加用户数量统计
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        // 查询该角色的用户数量 - 直接查询关联表，只统计未删除的用户
        const userCountQuery = await this.roleRepository.manager.query(
          'SELECT COUNT(*) as count FROM t_user_roles ur JOIN t_users u ON ur.user_id = u.id WHERE ur.role_id = ? AND u.is_deleted = 0',
          [role.id]
        );

        const userCount = userCountQuery[0]?.count || 0;

        return {
          ...role,
          userCount: parseInt(userCount)
        };
      })
    );

    return { roles: rolesWithUserCount, total };
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, isDeleted: 0 }, // 只查询未删除的角色
      relations: ['permissions'] // 启用权限关系
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // 检查是否为系统保护角色
    if (isProtectedRole(role.roleCode)) {
      throw new BadRequestException('系统角色不允许修改');
    }

    // 只允许修改描述
    const updateData: any = {};
    if (updateRoleDto.description !== undefined) {
      updateData.description = updateRoleDto.description;
    }

    if (Object.keys(updateData).length > 0) {
      await this.roleRepository.update(id, updateData);
    }

    // 如果提供了权限代码，更新权限分配
    if (updateRoleDto.permissionCodes !== undefined) {
      await this.assignPermissionsByCodes(id, updateRoleDto.permissionCodes);
    }

    return await this.findOne(id);
  }

  async remove(id: number, deletedBy?: number): Promise<void> {
    const role = await this.findOne(id);

    // 检查是否为系统保护角色
    if (isProtectedRole(role.roleCode)) {
      throw new BadRequestException('系统角色不允许删除');
    }

    // 查找使用该角色的用户，清空其角色关联
    const usersWithRole = await this.roleRepository.manager.query(
      'SELECT user_id FROM t_user_roles ur JOIN t_users u ON ur.user_id = u.id WHERE ur.role_id = ? AND u.is_deleted = 0',
      [id]
    );

    if (usersWithRole.length > 0) {
      // 删除所有使用该角色的用户角色关联，用户将没有角色，只能访问home页面
      await this.roleRepository.manager.query(
        'DELETE FROM t_user_roles WHERE role_id = ?',
        [id]
      );

      console.log(`角色删除：已清空 ${usersWithRole.length} 个用户的角色关联，这些用户现在只能访问home页面`);
    }

    // 软删除角色
    await this.roleRepository.update(id, {
      isDeleted: 1,
      updateBy: deletedBy
    });
  }

  async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'] // 启用权限关系
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 权限分配逻辑
    if (permissionIds.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) }
      });
      role.permissions = permissions;
    } else {
      role.permissions = [];
    }

    await this.roleRepository.save(role);
  }

  // 新增：通过权限代码分配权限
  async assignPermissionsByCodes(roleId: number, permissionCodes: string[]): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions']
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 根据权限代码查找权限
    if (permissionCodes.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { permissionCode: In(permissionCodes) }
      });
      role.permissions = permissions;
    } else {
      role.permissions = [];
    }

    await this.roleRepository.save(role);
  }
} 