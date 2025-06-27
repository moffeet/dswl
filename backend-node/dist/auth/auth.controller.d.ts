import { AuthService } from './auth.service';
import { LoginDto, WechatLoginDto, LoginResponseDto, LogoutResponseDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: any): Promise<LoginResponseDto>;
    wechatLogin(wechatLoginDto: WechatLoginDto): Promise<LoginResponseDto>;
    logout(req: any): Promise<LogoutResponseDto>;
    getProfile(req: any): Promise<{
        code: number;
        message: string;
        data: {
            id: any;
            username: any;
            nickname: any;
            status: any;
            phone: any;
            email: any;
            avatar: any;
            roles: any;
            lastLoginTime: any;
            lastLoginIp: any;
        };
    }>;
}
