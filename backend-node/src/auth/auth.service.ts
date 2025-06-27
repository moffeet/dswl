import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, WechatLoginDto, LoginResponseDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      sub: user.id,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);

    // TODO: 更新最后登录时间
    // await this.usersService.updateLastLoginAt(user.id);

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

  async wechatLogin(wechatLoginDto: WechatLoginDto): Promise<LoginResponseDto> {
    // TODO: 重新实现微信登录功能
    throw new UnauthorizedException('微信登录功能暂未实现');
  }

  private async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      return null;
    }

    if (user.status !== 'normal') {
      throw new UnauthorizedException('用户账号已被禁用');
    }

    // TODO: 实现密码验证
    // const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    // 临时实现，直接比较明文密码
    if (password !== user.password) {
      return null;
    }

    return user;
  }

  private async getWechatOpenid(code: string): Promise<string> {
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
      const response = await axios.get(url, { params });
      const data = response.data;

      if (data.errcode) {
        throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
      }

      return data.openid;
    } catch (error) {
      throw new UnauthorizedException('微信登录失败');
    }
  }
} 