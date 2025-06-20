export declare enum UserType {
    ADMIN = "admin",
    DRIVER = "driver",
    SALES = "sales"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare class User {
    id: number;
    username: string;
    password: string;
    realName: string;
    phone: string;
    wechatOpenid: string;
    userType: UserType;
    status: UserStatus;
    avatar: string;
    driverCode: string;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
