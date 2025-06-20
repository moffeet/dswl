import { UserType } from '../entities/user.entity';
export declare class SearchUserDto {
    page?: number;
    pageSize?: number;
    username?: string;
    realName?: string;
    phone?: string;
    email?: string;
    userType?: UserType;
}
