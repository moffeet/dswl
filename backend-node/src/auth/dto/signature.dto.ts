import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumberString, MinLength } from 'class-validator';

export class SignatureDto {
  @ApiProperty({
    description: '时间戳（毫秒）',
    example: '1704387123456',
    required: true
  })
  @IsNotEmpty({ message: '时间戳不能为空' })
  @IsNumberString({}, { message: '时间戳必须是数字字符串' })
  timestamp: string;

  @ApiProperty({
    description: '随机数（防重放攻击）',
    example: 'abc123def456',
    required: true,
    minLength: 8
  })
  @IsNotEmpty({ message: '随机数不能为空' })
  @IsString({ message: '随机数必须是字符串' })
  @MinLength(8, { message: '随机数长度不能少于8位' })
  nonce: string;

  @ApiProperty({
    description: '签名值（HMAC-SHA256）',
    example: 'a1b2c3d4e5f6...',
    required: true
  })
  @IsNotEmpty({ message: '签名不能为空' })
  @IsString({ message: '签名必须是字符串' })
  signature: string;

  @ApiProperty({
    description: '小程序用户ID',
    example: 1,
    required: true
  })
  @IsNotEmpty({ message: '用户ID不能为空' })
  wxUserId: number;
}

export class SignatureResponseDto {
  @ApiProperty({ description: '响应代码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应消息', example: '操作成功' })
  message: string;

  @ApiProperty({ description: '响应数据' })
  data: any;
}

export class SignatureErrorDto {
  @ApiProperty({ description: '错误代码', example: 401 })
  code: number;

  @ApiProperty({ description: '错误消息', example: '签名校验失败' })
  message: string;

  @ApiProperty({ description: '错误详情', example: null })
  data: null;
}
