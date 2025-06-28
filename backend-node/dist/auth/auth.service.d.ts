import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { BlacklistService } from './blacklist.service';
import { IpLimitService } from './ip-limit.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private blacklistService;
    private ipLimitService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, blacklistService: BlacklistService, ipLimitService: IpLimitService);
    login(loginDto: LoginDto, req?: any, forceLogin?: boolean): Promise<LoginResponseDto>;
    logout(userId: number, token?: string): Promise<{
        message: string;
    }>;
    private validateUser;
    private extractIpAddress;
    private updateLastLogin;
}
