import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SimpleLoginDto {
  @ApiProperty({
    description: '手机号授权code',
    example: '0c1234567890abcdef',
    required: true
  })
  @IsNotEmpty({ message: '手机号授权code不能为空' })
  @IsString({ message: '手机号授权code必须是字符串' })
  code: string;

  @ApiProperty({
    description: `设备唯一标识（支持加密传输）

🔐 **加密说明**：
- 设备标识支持加密传输，提高安全性
- 也支持明文传输（向后兼容）
- 用于设备绑定和身份验证

📱 **前端使用示例**：
\`\`\`javascript
// 明文传输（简单模式）
const deviceId = 'device_' + Date.now();

// 发送登录请求
const response = await fetch('/api/miniprogram/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'wx_phone_code_123',
    deviceId: deviceId
  })
});
\`\`\``,
    example: 'U2FsdGVkX1/8K7gWn5W2mQ8tP3X9vK2lN4F6hB8cD1E=',
    examples: {
      plaintext: {
        summary: '明文设备标识（兼容模式）',
        value: 'device_test_12345'
      },
      encrypted: {
        summary: '加密设备标识（推荐模式）',
        value: 'U2FsdGVkX1/8K7gWn5W2mQ8tP3X9vK2lN4F6hB8cD1E='
      }
    },
    required: false
  })
  @IsOptional()
  @IsString({ message: '设备标识必须是字符串' })
  deviceId?: string;


}

export class SimpleLoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '用户信息' })
  user: {
    id: number;
    name: string;
    phone: string;
    role: string;
  };
}
