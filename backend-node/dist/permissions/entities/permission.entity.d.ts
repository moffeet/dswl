export declare class Permission {
    id: number;
    permissionName: string;
    permissionCode: string;
    permissionType: 'menu' | 'button';
    parentId: number;
    path?: string;
    component?: string;
    icon?: string;
    sortOrder: number;
    status: 'normal' | 'disabled';
    createTime: Date;
    updateTime: Date;
}
