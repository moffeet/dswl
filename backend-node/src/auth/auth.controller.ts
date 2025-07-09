import { Controller, Post, Body, UseGuards, Get, Request, Res, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, LogoutResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RESPONSE_CODES, RESPONSE_MESSAGES } from '../common/constants/response-codes';
import { PermissionCheckService } from './permission-check.service';
import { CaptchaService } from './captcha.service';
import { SignatureService } from './signature.service';
import { WxUsersService } from '../wx-users/wx-users.service';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionCheckService: PermissionCheckService,
    private readonly captchaService: CaptchaService,
    private readonly signatureService: SignatureService,
    private readonly wxUsersService: WxUsersService
  ) {}

  @ApiOperation({ 
    summary: '用户登录',
    description: `
🔐 **用户登录接口 - 支持加密传输和明文兼容**

## 📋 功能说明
- 支持密码加密传输（推荐）和明文传输（兼容）
- 自动检测IP冲突，防止账号多地登录
- 防重放攻击机制，数据完整性验证
- 返回JWT访问令牌和用户基本信息

## 🔒 安全特性
- ✅ 密码加密传输（Base64 + XOR）
- ✅ 时间戳验证（5分钟有效期）
- ✅ 数字签名验证（防篡改）
- ✅ IP地址检查（防多地登录）
- ✅ JWT令牌管理（1小时有效期）

## 💡 使用建议
1. **开发环境**：可使用明文传输快速测试
2. **生产环境**：强烈建议使用加密传输
3. **IP冲突**：使用强制登录接口踢出其他会话

## 🚨 常见错误
- \`400\`：参数验证失败（密码长度不足等）
- \`401\`：用户名或密码错误，时间戳过期，签名验证失败
- \`409\`：账号已在其他位置登录（IP冲突）
- \`500\`：服务器内部错误
    `
  })
  @ApiBody({
    type: LoginDto,
    description: '登录请求参数',
    examples: {
      plaintext: {
        summary: '明文登录（兼容模式）',
        description: '使用明文密码登录，适合开发环境测试',
        value: {
          username: 'admin',
          password: '123456'
        }
      },
      encrypted: {
        summary: '加密登录（推荐模式）',
        description: '使用加密密码登录，生产环境推荐',
        value: {
          username: 'admin',
          password: 'U2FsdGVkX1/8K7gWn5W2mQ8tP3X9vK2lN4F6hB8cD1E=',
          timestamp: 1704387123456,
          signature: 'a7b8c9d',
          _encrypted: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '✅ 登录成功', 
    type: LoginResponseDto,
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '登录成功',
      data: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          username: 'admin',
          nickname: '系统管理员',
          status: 'active',
          roles: ['admin'],
          avatar: null,
          phone: '13800138000',
          email: 'admin@example.com'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '❌ 请求参数错误',
    example: {
      code: 400,
      message: '参数验证失败',
      data: null,
      errors: [
        'username不能为空',
        'password长度至少6位'
      ]
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '❌ 认证失败',
    examples: {
      wrongPassword: {
        summary: '用户名或密码错误',
        value: {
          code: 401,
          message: '用户名或密码错误',
          data: null
        }
      },
      timestampExpired: {
        summary: '时间戳过期',
        value: {
          code: 401,
          message: '请求已过期，请重新登录',
          data: null
        }
      },
      signatureInvalid: {
        summary: '签名验证失败',
        value: {
          code: 401,
          message: '数据签名验证失败',
          data: null
        }
      },
      decryptionFailed: {
        summary: '密码解密失败',
        value: {
          code: 401,
          message: '密码解密失败',
          data: null
        }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: '⚠️ 账号冲突（已在其他位置登录）',
    example: {
      code: 409,
      message: '账号已在其他位置登录，当前IP: 192.168.1.100，登录IP: 192.168.1.200。请使用强制登录或联系管理员。',
      data: null
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: '❌ 服务器内部错误',
    example: {
      code: RESPONSE_CODES.SERVER_ERROR,
      message: '服务器内部错误，请稍后重试',
      data: null
    }
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req) {
    try {
      const result = await this.authService.login(loginDto, req);
      return {
        code: RESPONSE_CODES.SUCCESS,
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

  @ApiOperation({ 
    summary: '强制登录（踢出其他会话）',
    description: `
🔥 **强制登录接口 - 解决IP冲突问题**

## 📋 功能说明
- 强制登录，自动踢出其他位置的登录会话
- 适用于用户忘记在其他设备登出的情况
- 同样支持加密传输和明文传输

## 🎯 使用场景
- 用户在家登录后，在公司无法登录
- 账号异常显示"已在其他位置登录"
- 需要紧急使用账号但其他设备无法登出

## ⚠️ 安全提醒
- 使用前请确认账号安全
- 建议在可信设备上使用
- 登录后及时修改密码（如怀疑账号泄露）
    `
  })
  @ApiBody({
    type: LoginDto,
    description: '强制登录请求参数（与普通登录相同）'
  })
  @ApiResponse({ 
    status: 200, 
    description: '✅ 强制登录成功', 
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '强制登录成功',
      data: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          username: 'admin',
          nickname: '系统管理员',
          status: 'active',
          roles: ['admin']
        }
      }
    }
  })
  @Post('login/force')
  async forceLogin(@Body() loginDto: LoginDto, @Request() req) {
    const result = await this.authService.login(loginDto, req, true);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '强制登录成功',
      data: result
    };
  }

  @ApiOperation({ 
    summary: '用户登出',
    description: `
🚪 **用户登出接口**

## 📋 功能说明
- 安全登出当前用户会话
- 将JWT令牌加入黑名单
- 清除服务器端会话信息

## 🔒 安全特性
- Token黑名单机制
- 会话状态清理
- 防止Token被滥用

## 💡 使用说明
- 需要在请求头中携带有效的JWT令牌
- 登出后令牌立即失效
- 建议在用户主动登出时调用
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: '✅ 登出成功', 
    type: LogoutResponseDto,
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '登出成功',
      data: null
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '❌ 未授权（Token无效或已过期）',
    example: {
      code: 401,
      message: 'Unauthorized',
      data: null
    }
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    // 从请求头中提取token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    const result = await this.authService.logout(req.user.id, token);
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: result.message,
      data: null
    };
  }

  @ApiOperation({ 
    summary: '获取当前用户信息',
    description: `
👤 **获取用户信息接口**

## 📋 功能说明
- 获取当前登录用户的详细信息
- 验证Token有效性
- 返回用户基本资料和权限信息

## 📊 返回信息
- 用户ID、用户名、昵称
- 手机号、邮箱、头像
- 用户状态、角色权限
- 最后登录时间和IP

## 🔒 安全说明
- 需要有效的JWT令牌
- 实时从数据库获取最新信息
- 权限变更立即生效
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: '✅ 获取成功',
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: {
        id: 1,
        username: 'admin',
        nickname: '系统管理员',
        status: 'active',
        phone: '13800138000',
        email: 'admin@example.com',
        avatar: null,
        roles: ['admin'],
        lastLoginTime: '2024-01-20T10:30:00.000Z',
        lastLoginIp: '192.168.1.100'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: '❌ 未授权（Token无效或已过期）',
    example: {
      code: 401,
      message: 'Unauthorized',
      data: null
    }
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return {
      code: RESPONSE_CODES.SUCCESS,
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

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取用户权限信息',
    description: '获取当前用户的权限信息，包括角色、权限列表和可访问的菜单'
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'object',
          properties: {
            hasRole: { type: 'boolean', description: '是否有角色' },
            roles: { type: 'array', description: '用户角色列表' },
            permissions: { type: 'array', items: { type: 'string' }, description: '权限代码列表' },
            menus: { type: 'array', description: '可访问的菜单列表' }
          }
        }
      }
    }
  })
  async getUserPermissions(@Request() req: any) {
    const permissionInfo = await this.permissionCheckService.getUserPermissionInfo(req.user.id);
    const menus = await this.permissionCheckService.getUserMenus(req.user.id);

    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: {
        hasRole: permissionInfo.hasRole,
        roles: permissionInfo.roles,
        permissions: permissionInfo.permissions,
        menus: menus
      }
    };
  }

  @ApiOperation({
    summary: '首次登录修改密码',
    description: `
🔑 **首次登录修改密码接口**

## 📋 功能说明
- 用于首次登录用户修改密码
- 密码必须包含英文和数字，长度6-12位
- 修改成功后可正常登录

## 🔒 密码规则
- 必须包含英文字母
- 必须包含数字
- 长度6-12位
- 不能与用户名相同

## 🔄 首次登录判断
- 系统通过账号和密码是否相同来判断是否为首次登录
- 新用户默认密码与用户名相同
- 首次登录必须修改密码
    `
  })
  @ApiBody({
    description: '修改密码请求参数',
    schema: {
      type: 'object',
      required: ['userId', 'newPassword'],
      properties: {
        userId: {
          type: 'number',
          description: '用户ID',
          example: 1
        },
        newPassword: {
          type: 'string',
          description: '新密码（英文+数字，6-12位）',
          example: 'abc123'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '✅ 修改成功',
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '密码修改成功',
      data: null
    }
  })
  @Post('change-password')
  async changePassword(@Body() body: { userId: number; newPassword: string }) {
    console.log('收到修改密码请求:', body);
    await this.authService.changePassword(body.userId, body.newPassword);
    console.log('密码修改成功');
    return {
      code: RESPONSE_CODES.SUCCESS,
      message: '密码修改成功',
      data: null
    };
  }

  @ApiOperation({
    summary: '获取验证码',
    description: `
🔐 **验证码生成接口**

## 📋 功能说明
- 生成图形验证码，用于登录安全验证
- 验证码有效期5分钟
- 验证码为4位数字和字母组合
- 大小写不敏感

## 🎯 使用场景
- 用户登录时需要输入验证码
- 提高系统安全性，防止暴力破解

## 📦 返回数据
- id: 验证码唯一标识
- svg: SVG格式的验证码图片
    `
  })
  @ApiResponse({
    status: 200,
    description: '✅ 验证码生成成功',
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '验证码生成成功',
      data: {
        id: 'abc123def456',
        svg: '<svg>...</svg>'
      }
    }
  })
  @Get('captcha')
  async getCaptcha(@Res() res: Response) {
    const captcha = this.captchaService.generateCaptcha();

    // 设置响应头
    res.setHeader('Content-Type', 'application/json');

    return res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '验证码生成成功',
      data: captcha
    });
  }

  @ApiOperation({
    summary: '获取用户签名密钥',
    description: `
🔑 **获取用户签名密钥接口**

## 📋 功能说明
- 获取指定小程序用户的签名密钥
- 用于开发调试和测试签名生成
- 仅供开发环境使用

## 🎯 使用场景
- 开发人员测试小程序接口签名
- 调试签名生成算法
- 验证签名计算是否正确

## ⚠️ 安全提醒
- 此接口仅供开发调试使用
- 生产环境应禁用或限制访问
- 签名密钥应妥善保管
    `
  })
  @ApiResponse({
    status: 200,
    description: '✅ 获取成功',
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功',
      data: {
        userId: 1,
        secretKey: 'a1b2c3d4e5f6...'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '❌ 用户不存在'
  })
  @Get('user-signature-key/:userId')
  async getUserSignatureKey(@Param('userId', ParseIntPipe) userId: number) {
    try {
      // 验证用户是否存在
      const user = await this.wxUsersService.findOne(userId);
      if (!user) {
        return {
          code: RESPONSE_CODES.PARAM_ERROR,
          message: '用户不存在',
          data: null
        };
      }

      // 获取用户签名密钥
      const secretKey = this.signatureService.getUserSignatureKey(userId);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '获取成功',
        data: {
          userId,
          secretKey
        }
      };
    } catch (error) {
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }
}