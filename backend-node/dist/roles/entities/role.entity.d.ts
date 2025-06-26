export declare class Role {
    id: number;
    roleName: string;
    roleCode: string;
    description?: string;
    status: '启用' | '禁用';
    createBy?: number;
    createTime: Date;
    updateTime: Date;
}
