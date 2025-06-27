import { Role } from '../../roles/entities/role.entity';
export declare class User {
    id: number;
    username: string;
    password: string;
    nickname?: string;
    phone?: string;
    email?: string;
    gender?: 'male' | 'female';
    status: 'normal' | 'disabled';
    avatar?: string;
    lastLoginTime?: Date;
    lastLoginIp?: string;
    wechatOpenid?: string;
    createBy?: number;
    createTime: Date;
    updateTime: Date;
    roles: Role[];
}
