export declare class CreateUserDto {
    username: string;
    password: string;
    nickname?: string;
    phone?: string;
    email?: string;
    gender?: '男' | '女';
    status?: '启用' | '禁用';
    avatar?: string;
    roleIds?: number[];
}
