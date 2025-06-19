import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, WechatLoginDto, LoginResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: '微信小程序登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @Post('wechat-login')
  async wechatLogin(@Body() wechatLoginDto: WechatLoginDto): Promise<LoginResponseDto> {
    return this.authService.wechatLogin(wechatLoginDto);
  }

  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return {
      id: req.user.id,
      username: req.user.username,
      realName: req.user.realName,
      userType: req.user.userType,
      status: req.user.status,
      phone: req.user.phone,
      avatar: req.user.avatar,
      driverCode: req.user.driverCode,
      lastLoginAt: req.user.lastLoginAt,
    };
  }
} 