import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: any): Promise<{
        code: number;
        message: string;
        data: LoginResponseDto;
    } | {
        code: number;
        message: any;
        data: any;
    }>;
    forceLogin(loginDto: LoginDto, req: any): Promise<{
        code: number;
        message: string;
        data: LoginResponseDto;
    }>;
    logout(req: any): Promise<{
        code: number;
        message: string;
        data: any;
    }>;
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
