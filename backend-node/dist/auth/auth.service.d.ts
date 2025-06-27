import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, WechatLoginDto, LoginResponseDto } from './dto/login.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    login(loginDto: LoginDto, req?: any): Promise<LoginResponseDto>;
    wechatLogin(wechatLoginDto: WechatLoginDto): Promise<LoginResponseDto>;
    logout(userId: number): Promise<{
        message: string;
    }>;
    private validateUser;
    private updateLastLogin;
    private getWechatOpenid;
}
