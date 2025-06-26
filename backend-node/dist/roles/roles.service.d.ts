import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
export interface CreateRoleDto {
    roleName: string;
    roleCode: string;
    description?: string;
    status?: '启用' | '禁用';
    permissionIds?: number[];
}
export interface UpdateRoleDto {
    roleName?: string;
    roleCode?: string;
    description?: string;
    status?: '启用' | '禁用';
    permissionIds?: number[];
}
export interface SearchRoleDto {
    roleName?: string;
    roleCode?: string;
    status?: '启用' | '禁用';
    page?: number;
    size?: number;
}
export declare class RolesService {
    private readonly roleRepository;
    private readonly permissionRepository;
    constructor(roleRepository: Repository<Role>, permissionRepository: Repository<Permission>);
    create(createRoleDto: CreateRoleDto): Promise<Role>;
    findAll(searchDto: SearchRoleDto): Promise<{
        roles: Role[];
        total: number;
    }>;
    findOne(id: number): Promise<Role>;
    update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role>;
    remove(id: number): Promise<void>;
    assignPermissions(roleId: number, permissionIds: number[]): Promise<void>;
}
