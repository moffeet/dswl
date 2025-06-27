import { Permission } from '../../permissions/entities/permission.entity';
export declare class Role {
    id: number;
    roleName: string;
    roleCode: string;
    description?: string;
    status: '启用' | '禁用';
    miniAppLoginEnabled: boolean;
    createBy?: number;
    createTime: Date;
    updateTime: Date;
    permissions: Permission[];
}
