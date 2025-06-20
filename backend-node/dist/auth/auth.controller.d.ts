import { AuthService } from './auth.service';
import { LoginDto, WechatLoginDto, LoginResponseDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    wechatLogin(wechatLoginDto: WechatLoginDto): Promise<LoginResponseDto>;
    getProfile(req: any): Promise<{
        id: any;
        username: any;
        realName: any;
        userType: any;
        status: any;
        phone: any;
        avatar: any;
        driverCode: any;
        lastLoginAt: any;
    }>;
}
