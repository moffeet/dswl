import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
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
export declare class PermissionsService {
    private readonly permissionRepository;
    constructor(permissionRepository: Repository<Permission>);
    create(createPermissionDto: CreatePermissionDto): Promise<Permission>;
    findAll(searchDto: SearchPermissionDto): Promise<{
        permissions: Permission[];
        total: number;
    }>;
    findMenuTree(): Promise<Permission[]>;
    findButtonPermissions(): Promise<Permission[]>;
    findOne(id: number): Promise<Permission>;
    update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission>;
    remove(id: number): Promise<void>;
    private buildTree;
}
