"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users/users.service");
const axios_1 = __importDefault(require("axios"));
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const payload = {
            sub: user.id,
            username: user.username,
        };
        const accessToken = this.jwtService.sign(payload);
        return {
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                status: user.status,
            },
        };
    }
    async wechatLogin(wechatLoginDto) {
        throw new common_1.UnauthorizedException('微信登录功能暂未实现');
    }
    async validateUser(username, password) {
        const user = await this.usersService.findByUsername(username);
        if (!user) {
            return null;
        }
        if (user.status !== '启用') {
            throw new common_1.UnauthorizedException('用户已被禁用');
        }
        if (password !== user.password) {
            return null;
        }
        return user;
    }
    async getWechatOpenid(code) {
        const appid = this.configService.get('WECHAT_APPID');
        const secret = this.configService.get('WECHAT_SECRET');
        const url = 'https://api.weixin.qq.com/sns/jscode2session';
        const params = {
            appid,
            secret,
            js_code: code,
            grant_type: 'authorization_code',
        };
        try {
            const response = await axios_1.default.get(url, { params });
            const data = response.data;
            if (data.errcode) {
                throw new common_1.UnauthorizedException(`微信登录失败: ${data.errmsg}`);
            }
            return data.openid;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('微信登录失败');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map