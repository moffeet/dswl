export declare class CreateUserDto {
    username: string;
    password: string;
    nickname?: string;
    phone?: string;
    email?: string;
    gender?: 'male' | 'female';
    status?: 'normal' | 'disabled';
    avatar?: string;
    roleIds?: number[];
}
