import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { BlacklistService } from '../blacklist.service';
export interface JwtPayload {
    sub: number;
    username: string;
    userType: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private usersService;
    private blacklistService;
    constructor(configService: ConfigService, usersService: UsersService, blacklistService: BlacklistService);
    validate(req: any, payload: JwtPayload): Promise<import("../../users/entities/user.entity").User>;
}
export {};
