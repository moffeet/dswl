import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, WechatLoginDto, LoginResponseDto, LogoutResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req): Promise<LoginResponseDto> {
    return this.authService.login(loginDto, req);
  }

  @ApiOperation({ summary: '微信小程序登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @Post('wechat-login')
  async wechatLogin(@Body() wechatLoginDto: WechatLoginDto): Promise<LoginResponseDto> {
    return this.authService.wechatLogin(wechatLoginDto);
  }

  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功', type: LogoutResponseDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req): Promise<LogoutResponseDto> {
    return this.authService.logout(req.user.id);
  }

  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return {
      code: 200,
      message: '获取成功',
      data: {
        id: req.user.id,
        username: req.user.username,
        nickname: req.user.nickname,
        status: req.user.status,
        phone: req.user.phone,
        email: req.user.email,
        avatar: req.user.avatar,
        roles: req.user.roles || [],
        lastLoginTime: req.user.lastLoginTime,
        lastLoginIp: req.user.lastLoginIp,
      }
    };
  }
} 