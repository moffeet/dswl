export declare class LoginDto {
    username: string;
    password: string;
}
export declare class WechatLoginDto {
    code: string;
}
export declare class ResetPasswordDto {
    email: string;
}
export declare class ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
}
export declare class LoginResponseDto {
    accessToken: string;
    user: {
        id: number;
        username: string;
        nickname?: string;
        status: string;
        roles?: any[];
        avatar?: string;
        phone?: string;
        email?: string;
    };
}
export declare class LogoutResponseDto {
    message: string;
}
