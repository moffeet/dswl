import { UserType, UserStatus } from '../entities/user.entity';
export declare enum Gender {
    MALE = "male",
    FEMALE = "female"
}
export declare class CreateUserDto {
    username: string;
    password: string;
    realName: string;
    phone: string;
    email?: string;
    gender?: Gender;
    nickname?: string;
    userType: UserType;
    status?: UserStatus;
    wechatOpenid?: string;
    driverCode?: string;
    avatar?: string;
}
