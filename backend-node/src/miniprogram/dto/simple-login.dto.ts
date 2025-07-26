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
    description: `设备唯一标识（加密传输）

🔐 **加密说明**：
- 设备标识需要使用与登录相同的加密方式传输
- 加密后的数据包含设备ID、时间戳和随机数
- 支持明文传输（向后兼容）

📱 **前端加密示例**：
\`\`\`javascript
import { encryptDeviceData } from '@/utils/crypto';

// 加密设备标识
const encryptedDeviceId = encryptDeviceData('device_test_12345');

// 发送登录请求
const response = await fetch('/api/miniprogram/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'wx_phone_code_123',
    deviceId: encryptedDeviceId, // 加密后的设备标识
    timestamp: Date.now(),
    signature: generateSignature(...)
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

  @ApiPropertyOptional({
    description: '时间戳 - 用于防重放攻击（可选）',
    example: 1704387123456
  })
  @IsOptional()
  @IsNumber({}, { message: '时间戳必须是数字' })
  timestamp?: number;

  @ApiPropertyOptional({
    description: '数字签名 - 用于数据完整性验证（可选）',
    example: 'abc123def456'
  })
  @IsOptional()
  @IsString({ message: '签名必须是字符串' })
  signature?: string;
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
