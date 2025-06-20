import { UserType } from '../entities/user.entity';
export declare class CreateUserDto {
    username: string;
    password: string;
    realName: string;
    phone: string;
    userType: UserType;
    wechatOpenid?: string;
    driverCode?: string;
}
