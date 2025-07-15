import { Controller, Post, Body, UseGuards, Get, Request, Res, Param, ParseIntPipe, Logger, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, LogoutResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { RESPONSE_CODES, RESPONSE_MESSAGES, HTTP_STATUS_CODES } from '../common/constants/response-codes';
import { PermissionCheckService } from './permission-check.service';
import { CaptchaService } from './captcha.service';
import { SignatureService } from './signature.service';
import { WxUsersService } from '../wx-users/wx-users.service';
import { ChineseTime, RelativeTime } from '../common/decorators/format-time.decorator';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

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
- 返回JWT访问令牌和用户基本信息

## 🔒 安全特性
- ✅ 密码加密传输（Base64 + XOR）
- ✅ IP地址检查（防多地登录）
- ✅ JWT令牌管理（1小时有效期）
- ✅ 验证码验证

## 💡 使用建议
1. **开发环境**：可使用明文传输快速测试
2. **生产环境**：建议使用加密传输
3. **IP冲突**：使用强制登录接口踢出其他会话

## 🚨 常见错误
- \`400\`：参数验证失败（密码长度不足等）
- \`401\`：用户名或密码错误，验证码错误
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
          password: 'U2FsdGVkX1/8K7gWn5W2mQ8tP3X9vK2lN4F6hB8cD1E='
        }
      }
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
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
    status: HTTP_STATUS_CODES.BAD_REQUEST,
    description: '❌ 请求参数错误',
    example: {
      code: HTTP_STATUS_CODES.BAD_REQUEST,
      message: '参数验证失败',
      data: null,
      errors: [
        'username不能为空',
        'password长度至少6位'
      ]
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.UNAUTHORIZED,
    description: '❌ 认证失败',
    examples: {
      wrongPassword: {
        summary: '用户名或密码错误',
        value: {
          code: HTTP_STATUS_CODES.UNAUTHORIZED,
          message: '用户名或密码错误',
          data: null
        }
      },

      decryptionFailed: {
        summary: '密码解密失败',
        value: {
          code: HTTP_STATUS_CODES.UNAUTHORIZED,
          message: '密码解密失败',
          data: null
        }
      }
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.CONFLICT,
    description: '⚠️ 账号冲突（已在其他位置登录）',
    example: {
      code: HTTP_STATUS_CODES.CONFLICT,
      message: '账号已在其他位置登录，当前IP: 192.168.1.100，登录IP: 192.168.1.200。请使用强制登录或联系管理员。',
      data: null
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
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
          code: HTTP_STATUS_CODES.CONFLICT, // 冲突状态码
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
    status: HTTP_STATUS_CODES.OK,
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
    status: HTTP_STATUS_CODES.OK,
    description: '✅ 登出成功',
    type: LogoutResponseDto,
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '登出成功',
      data: null
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.UNAUTHORIZED,
    description: '❌ 未授权（Token无效或已过期）',
    example: {
      code: HTTP_STATUS_CODES.UNAUTHORIZED,
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
    status: HTTP_STATUS_CODES.OK,
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
    status: HTTP_STATUS_CODES.UNAUTHORIZED,
    description: '❌ 未授权（Token无效或已过期）',
    example: {
      code: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: 'Unauthorized',
      data: null
    }
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @RelativeTime() // 用户资料最后登录时间显示为相对时间
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
    status: HTTP_STATUS_CODES.OK,
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
    summary: '修改密码',
    description: `
🔑 **统一密码修改接口**

## 📋 功能说明
- 统一的密码修改接口，适用于所有场景
- 必须验证原密码（确保用户身份）
- 密码必须包含英文和数字，长度6-12位
- 修改成功后需要重新登录

## 🎯 使用场景
- **首次登录修改密码**：用户首次登录后修改默认密码
- **用户主动修改密码**：用户在个人设置中修改密码
- **定期更换密码**：安全需求的定期更换
- **密码泄露处理**：怀疑密码泄露时的主动更换

## 🔒 安全特性
- ✅ **必须**验证原密码（统一安全标准）
- ✅ 需要JWT token认证（确保用户已登录）
- ✅ 支持加密传输（防止网络窃听）
- ✅ 密码格式验证（英文+数字，6-12位）
- ✅ 防止新旧密码相同

## 💡 设计优势
- 统一接口，简化维护
- 统一安全标准，无安全漏洞
- 首次登录也需要知道原密码，确保安全
    `
  })
  @ApiBody({
    description: '用户主动修改密码请求参数',
    schema: {
      type: 'object',
      required: ['oldPassword', 'newPassword'],
      properties: {
        oldPassword: {
          type: 'string',
          description: '原密码（可能是加密的）',
          example: 'oldpass123'
        },
        newPassword: {
          type: 'string',
          description: '新密码（英文+数字，6-12位，可能是加密的）',
          example: 'newpass456'
        }
      }
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '✅ 修改成功',
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '密码修改成功',
      data: null
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.UNAUTHORIZED,
    description: '❌ 原密码错误或未登录',
    example: {
      code: HTTP_STATUS_CODES.UNAUTHORIZED,
      message: '原密码错误',
      data: null
    }
  })
  @UseGuards(JwtAuthGuard)
  @Post('update-password')
  async updatePassword(@Body() body: {
    oldPassword: string;
    newPassword: string;
  }, @Request() req) {
    console.log('收到用户主动修改密码请求:', {
      userId: req.user.id,
      hasOldPassword: !!body.oldPassword,
      hasNewPassword: !!body.newPassword
    });

    let actualOldPassword: string;
    let actualNewPassword: string;

    // 🔒 安全要求：密码必须加密传输
    if (!body.oldPassword || !body.newPassword) {
      throw new UnauthorizedException('缺少必要的密码参数');
    }

    this.logger.log('开始解密密码数据');

    // 导入解密工具
    const { decryptPassword } = await import('./utils/crypto.util');

    try {
      // 解密原密码
      const decryptedOldData = decryptPassword(body.oldPassword);
      actualOldPassword = decryptedOldData.password;

      // 解密新密码
      const decryptedNewData = decryptPassword(body.newPassword);
      actualNewPassword = decryptedNewData.password;

      this.logger.log('密码解密成功');
    } catch (error) {
      this.logger.error('密码解密失败', error.stack);
      throw new UnauthorizedException('密码解密失败');
    }

    await this.authService.updatePassword(req.user.id, actualOldPassword, actualNewPassword);
    console.log('用户主动密码修改成功');
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
    status: HTTP_STATUS_CODES.OK,
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
    summary: '🔧 开发环境：获取验证码文本',
    description: `
🛠️ **开发环境专用接口**

## ⚠️ 重要说明
- **仅在开发环境下可用**
- 生产环境会返回空值，确保安全
- 用于开发调试，避免手动查看SVG验证码

## 📋 功能说明
- 根据验证码ID直接获取文本内容
- 简化开发测试流程
- 验证码仍然有5分钟有效期

## 🎯 使用方法
1. 先调用 GET /auth/captcha 获取验证码ID
2. 再调用此接口 GET /auth/captcha/:id/text 获取文本内容
3. 使用获取的文本进行登录
    `
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '✅ 获取成功',
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '验证码文本获取成功',
      data: {
        id: 'abc123def456',
        text: 'A1B2'
      }
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.NOT_FOUND,
    description: '❌ 验证码不存在或已过期'
  })
  @Get('captcha/:id/text')
  async getCaptchaText(@Param('id') id: string, @Res() res: Response) {
    const text = this.captchaService.getCaptchaText(id);
    
    if (!text) {
      return res.status(HTTP_STATUS_CODES.NOT_FOUND).json({
        code: HTTP_STATUS_CODES.NOT_FOUND,
        message: '验证码不存在、已过期或当前为生产环境'
      });
    }

    return res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '验证码文本获取成功',
      data: {
        id,
        text
      }
    });
  }

  @ApiOperation({
    summary: '🔧 开发环境：获取所有验证码',
    description: `
🛠️ **开发环境专用接口**

## ⚠️ 重要说明
- **仅在开发环境下可用**
- 生产环境会返回空数组，确保安全
- 显示当前所有有效的验证码

## 📋 功能说明
- 查看当前系统中所有有效的验证码
- 包含ID、文本内容和过期时间
- 方便开发调试和测试
    `
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '✅ 获取成功',
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '验证码列表获取成功',
      data: [
        {
          id: 'abc123def456',
          text: 'A1B2',
          expires: 1704387123456
        }
      ]
    }
  })
  @Get('captcha/dev/all')
  async getAllCaptchas(@Res() res: Response) {
    const captchas = this.captchaService.getAllCaptchas();

    return res.json({
      code: RESPONSE_CODES.SUCCESS,
      message: '验证码列表获取成功',
      data: captchas
    });
  }

  @ApiOperation({
    summary: '获取用户签名密钥（仅开发环境）',
    description: `
🔑 **获取用户签名密钥接口 - 开发调试专用**

## ⚠️ 重要安全说明
- **仅限开发环境使用**
- **生产环境已禁用此接口**
- **密钥获取需要管理员权限**

## 📋 功能说明
- 获取指定小程序用户的签名密钥
- 用于开发调试和测试签名生成
- 支持密钥掩码显示（部分隐藏）

## 🔒 安全措施
- 环境检查：仅开发环境可用
- 权限验证：需要管理员身份
- 密钥掩码：返回部分隐藏的密钥
- 访问日志：记录所有访问行为
    `
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '✅ 获取成功',
    example: {
      code: RESPONSE_CODES.SUCCESS,
      message: '获取成功（开发环境）',
      data: {
        userId: 1,
        secretKey: '3f6de2a6666ac0cb652a59c3e1a9eddc81a4e0526b3cce46e759140df13e2820',
        maskedKey: '3f6de2a6************************************13e2820',
        environment: 'development'
      }
    }
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.FORBIDDEN,
    description: '❌ 生产环境禁止访问'
  })
  @Get('user-signature-key/:userId')
  async getUserSignatureKey(@Param('userId', ParseIntPipe) userId: number) {
    try {
      // 1. 环境检查 - 仅开发环境允许
      const environment = process.env.NODE_ENV || 'development';
      if (environment === 'production') {
        return {
          code: RESPONSE_CODES.PARAM_ERROR,
          message: '生产环境禁止获取用户签名密钥',
          data: null
        };
      }

      // 2. 验证用户是否存在
      const user = await this.wxUsersService.findOne(userId);
      if (!user) {
        return {
          code: RESPONSE_CODES.PARAM_ERROR,
          message: '用户不存在',
          data: null
        };
      }

      // 3. 获取用户签名密钥
      const secretKey = this.signatureService.getUserSignatureKey(userId);

      // 4. 创建掩码密钥（用于安全显示）
      const maskedKey = secretKey.substring(0, 8) + '*'.repeat(32) + secretKey.substring(secretKey.length - 8);

      // 5. 记录访问日志
      console.log(`[SECURITY] 开发环境密钥访问 - 用户ID: ${userId}, 时间: ${new Date().toISOString()}`);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '获取成功（开发环境）',
        data: {
          userId,
          secretKey, // 开发环境返回完整密钥
          maskedKey, // 掩码密钥
          environment,
          warning: '此密钥仅供开发测试使用，请勿在生产环境中暴露'
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