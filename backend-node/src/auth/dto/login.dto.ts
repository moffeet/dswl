import { IsString, MinLength, IsEmail, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin',
    type: 'string'
  })
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  @ApiProperty({ 
    description: `密码字段 - 支持两种模式：
    
📍 **明文模式（兼容）**：
- 直接传入明文密码，如 "123456"
- 系统会自动识别并处理

🔐 **加密模式（推荐）**：
- 前端使用以下算法加密密码后传输
- 加密步骤：
  1. 创建数据包：{password: "123456", timestamp: 1704387123456, nonce: "随机字符串"}
  2. JSON序列化：JSON.stringify(数据包)
  3. Base64编码：btoa(JSON字符串)
  4. XOR加密：使用密钥 'logistics-frontend-2024-secure-key-v1' 进行XOR运算
  5. 再次Base64编码：btoa(加密结果)

💡 **前端加密示例代码**：
\`\`\`javascript
// 1. 引入加密工具
import { createSecureLoginData } from '@/utils/crypto';

// 2. 创建加密数据包
const secureData = createSecureLoginData('admin', '123456');

// 3. 发送登录请求
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(secureData)
});
\`\`\``,
    example: '123456',
    examples: {
      plaintext: {
        summary: '明文密码（兼容模式）',
        value: '123456'
      },
      encrypted: {
        summary: '加密密码（推荐模式）',
        value: 'U2FsdGVkX1/8K7gWn5W2mQ8tP3X9vK2lN4F6hB8cD1E='
      }
    }
  })
  @IsString({ message: '密码必须是字符串' })
  password: string;

  @ApiPropertyOptional({
    description: `时间戳 - 可选参数（已不再验证）

⏰ **说明**：
- 此参数已不再进行验证
- 保留是为了向后兼容
- 可以不传递此参数`,
    example: 1704387123456,
    type: 'number'
  })
  @IsOptional()
  @IsNumber({}, { message: '时间戳必须是数字' })
  timestamp?: number;

  @ApiPropertyOptional({
    description: `数字签名 - 可选参数（已不再验证）

🔏 **说明**：
- 此参数已不再进行验证
- 保留是为了向后兼容
- 可以不传递此参数`,
    example: 'a7b8c9d',
    type: 'string'
  })
  @IsOptional()
  @IsString({ message: '签名必须是字符串' })
  signature?: string;



  @ApiProperty({
    description: `验证码ID - 从验证码接口获取的唯一标识

🔐 **使用说明**：
- 通过 GET /auth/captcha 接口获取
- 用于验证码验证时的标识
- 验证码有效期5分钟`,
    example: 'abc123def456',
    type: 'string'
  })
  @IsString({ message: '验证码ID必须是字符串' })
  captchaId: string;

  @ApiProperty({
    description: `验证码 - 用户输入的验证码内容

🔐 **使用说明**：
- 4位数字和字母组合
- 大小写不敏感
- 一次性使用，验证后失效`,
    example: 'A1B2',
    type: 'string'
  })
  @IsString({ message: '验证码必须是字符串' })
  captchaCode: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: '旧密码' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密码' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT访问令牌', required: false })
  accessToken?: string;

  @ApiProperty({ description: '用户信息', required: false })
  user?: {
    id: number;
    username: string;
    nickname: string;
    roles?: any[];
  };

  @ApiProperty({ description: '是否需要修改密码', required: false })
  requirePasswordChange?: boolean;

  @ApiProperty({ description: '用户ID（首次登录时）', required: false })
  userId?: number;

  @ApiProperty({ description: '用户名（首次登录时）', required: false })
  username?: string;

  @ApiProperty({ description: '消息', required: false })
  message?: string;
}

export class LogoutResponseDto {
  @ApiProperty({ description: '登出消息' })
  message: string;
} 