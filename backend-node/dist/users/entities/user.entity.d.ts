export declare class User {
    id: number;
    username: string;
    password: string;
    nickname?: string;
    phone?: string;
    email?: string;
    gender?: '男' | '女';
    status: '启用' | '禁用';
    avatar?: string;
    lastLoginTime?: Date;
    lastLoginIp?: string;
    createBy?: number;
    createTime: Date;
    updateTime: Date;
}
