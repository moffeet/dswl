export declare class LoginDto {
    username: string;
    password: string;
}
export declare class WechatLoginDto {
    code: string;
}
export declare class LoginResponseDto {
    accessToken: string;
    user: {
        id: number;
        username: string;
        realName: string;
        userType: string;
        status: string;
    };
}
