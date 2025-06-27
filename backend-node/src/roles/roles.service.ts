import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

export interface CreateRoleDto {
  roleName: string;
  roleCode: string;
  description?: string;
  status?: '启用' | '禁用';
  miniAppLoginEnabled?: boolean;
  permissionIds?: number[];
}

export interface UpdateRoleDto {
  roleName?: string;
  roleCode?: string;
  description?: string;
  status?: '启用' | '禁用';
  miniAppLoginEnabled?: boolean;
  permissionIds?: number[];
}

export interface SearchRoleDto {
  roleName?: string;
  roleCode?: string;
  status?: '启用' | '禁用';
  miniAppLoginEnabled?: boolean;
  page?: number;
  size?: number;
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

    const role = this.roleRepository.create({
      roleName: createRoleDto.roleName,
      roleCode: createRoleDto.roleCode,
      description: createRoleDto.description,
      status: createRoleDto.status || '启用',
      miniAppLoginEnabled: createRoleDto.miniAppLoginEnabled
    });

    const savedRole = await this.roleRepository.save(role);

    // 如果提供了权限ID，分配权限
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      await this.assignPermissions(savedRole.id, createRoleDto.permissionIds);
    }

    return await this.findOne(savedRole.id);
  }

  async findAll(searchDto: SearchRoleDto): Promise<{ roles: Role[], total: number }> {
    const { page = 1, size = 10, ...filters } = searchDto;
    const where: any = {};

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
      skip: (page - 1) * size,
      take: size,
      order: { createTime: 'DESC' }
    });

    // 为每个角色添加用户数量统计
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        // 查询该角色的用户数量 - 直接查询关联表
        const userCountQuery = await this.roleRepository.manager.query(
          'SELECT COUNT(*) as count FROM t_user_roles WHERE role_id = ?',
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
      where: { id },
      relations: ['permissions'] // 启用权限关系
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // 检查角色编码是否已存在（排除当前角色）
    if (updateRoleDto.roleCode && updateRoleDto.roleCode !== role.roleCode) {
      const existingRole = await this.roleRepository.findOne({
        where: { roleCode: updateRoleDto.roleCode }
      });
      if (existingRole) {
        throw new ConflictException('角色编码已存在');
      }
    }

    await this.roleRepository.update(id, {
      roleName: updateRoleDto.roleName,
      roleCode: updateRoleDto.roleCode,
      description: updateRoleDto.description,
      status: updateRoleDto.status,
      miniAppLoginEnabled: updateRoleDto.miniAppLoginEnabled
    });

    // 如果提供了权限ID，更新权限分配
    if (updateRoleDto.permissionIds !== undefined) {
      await this.assignPermissions(id, updateRoleDto.permissionIds);
    }

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
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
} 