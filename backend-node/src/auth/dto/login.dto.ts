import { IsString, MinLength, IsEmail, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    description: '用户名', 
    example: 'admin',
    type: 'string'
  })
  @IsString()
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
  @IsString()
  password: string;

  @ApiPropertyOptional({ 
    description: `时间戳 - 防重放攻击机制
    
⏰ **生成规则**：
- 使用 Date.now() 获取当前毫秒时间戳
- 服务器验证时间窗口：5分钟内有效
- 超时请求将被拒绝

📝 **生成示例**：
\`\`\`javascript
const timestamp = Date.now(); // 例如：1704387123456
\`\`\`

⚠️ **注意事项**：
- 仅在加密模式下需要（_encrypted: true）
- 客户端时间与服务器时间差不能超过5分钟
- 用于防止网络请求被重复使用`,
    example: 1704387123456,
    type: 'number'
  })
  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @ApiPropertyOptional({ 
    description: `数字签名 - 数据完整性验证
    
🔏 **生成算法**：
1. 拼接字符串：用户名 + 加密密码 + 时间戳
2. 计算哈希值：简单哈希算法（((hash << 5) - hash) + char）
3. 转换为36进制字符串

📝 **生成示例**：
\`\`\`javascript
function generateSignature(username, encryptedPassword, timestamp) {
  const data = username + encryptedPassword + timestamp;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

const signature = generateSignature('admin', encryptedPassword, 1704387123456);
// 结果示例：'a7b8c9d'
\`\`\`

⚠️ **验证规则**：
- 仅在加密模式下需要（_encrypted: true）
- 服务器会重新计算签名并对比验证
- 签名不匹配将拒绝登录请求`,
    example: 'a7b8c9d',
    type: 'string'
  })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({ 
    description: `加密标识 - 标识当前请求是否使用加密模式
    
🔐 **使用说明**：
- true：使用加密传输（需要 timestamp 和 signature）
- false/undefined：明文传输（兼容模式）

📦 **完整加密请求示例**：
\`\`\`json
{
  "username": "admin",
  "password": "U2FsdGVkX1/8K7gWn5W2mQ8tP3X9vK2lN4F6hB8cD1E=",
  "timestamp": 1704387123456,
  "signature": "a7b8c9d",
  "_encrypted": true
}
\`\`\`

📦 **明文请求示例**：
\`\`\`json
{
  "username": "admin",
  "password": "123456"
}
\`\`\``,
    example: true,
    type: 'boolean'
  })
  @IsOptional()
  @IsBoolean()
  _encrypted?: boolean;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '邮箱地址' })
  @IsEmail()
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