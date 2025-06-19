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
      userType: user.userType,
    };

    const accessToken = this.jwtService.sign(payload);

    // 更新最后登录时间
    await this.usersService.updateLastLoginAt(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        userType: user.userType,
        status: user.status,
      },
    };
  }

  async wechatLogin(wechatLoginDto: WechatLoginDto): Promise<LoginResponseDto> {
    // 调用微信API获取openid
    const openid = await this.getWechatOpenid(wechatLoginDto.code);
    
    // 根据openid查找用户
    let user = await this.usersService.findByWechatOpenid(openid);
    
    if (!user) {
      throw new UnauthorizedException('用户未绑定微信，请先联系管理员');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('用户已被禁用');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      userType: user.userType,
    };

    const accessToken = this.jwtService.sign(payload);

    // 更新最后登录时间
    await this.usersService.updateLastLoginAt(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        userType: user.userType,
        status: user.status,
      },
    };
  }

  private async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      return null;
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('用户已被禁用');
    }

    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    
    if (!isPasswordValid) {
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