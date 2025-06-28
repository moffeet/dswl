import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, LogoutResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req) {
    try {
      const result = await this.authService.login(loginDto, req);
      return {
        code: 200,
        message: '登录成功',
        data: result
      };
    } catch (error) {
      // 如果是IP冲突错误，返回特殊错误码
      if (error.message.includes('账号已在其他位置登录')) {
        return {
          code: 409, // 冲突状态码
          message: error.message,
          data: null
        };
      }
      throw error;
    }
  }

  @Post('login/force')
  @ApiOperation({ summary: '强制登录（踢出其他会话）' })
  async forceLogin(@Body() loginDto: LoginDto, @Request() req) {
    const result = await this.authService.login(loginDto, req, true);
    return {
      code: 200,
      message: '强制登录成功',
      data: result
    };
  }



  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功', type: LogoutResponseDto })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    // 从请求头中提取token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    const result = await this.authService.logout(req.user.id, token);
    return {
      code: 200,
      message: result.message,
      data: null
    };
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