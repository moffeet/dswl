import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class WxLoginDto {
  @ApiProperty({
    description: '微信openid',
    example: 'wx_openid_123456789',
    required: true
  })
  @IsNotEmpty({ message: '微信openid不能为空' })
  @IsString({ message: '微信openid必须是字符串' })
  wechatId: string;

  @ApiProperty({
    description: '用户手机号',
    example: '13800138001',
    required: true
  })
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsString({ message: '手机号必须是字符串' })
  phone: string;

  @ApiProperty({
    description: '设备MAC地址',
    example: '00:11:22:33:44:55',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'MAC地址必须是字符串' })
  macAddress?: string;
}

// 微信授权登录DTO
export class WxPhoneLoginDto {
  @ApiProperty({
    description: '手机号授权code',
    example: '0c1234567890abcdef',
    required: true
  })
  @IsNotEmpty({ message: '手机号授权code不能为空' })
  @IsString({ message: '手机号授权code必须是字符串' })
  code: string;

  @ApiProperty({
    description: '微信登录code',
    example: '0a1234567890abcdef',
    required: true
  })
  @IsNotEmpty({ message: '微信登录code不能为空' })
  @IsString({ message: '微信登录code必须是字符串' })
  jsCode: string;

  @ApiProperty({
    description: '设备MAC地址',
    example: '00:11:22:33:44:55',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'MAC地址必须是字符串' })
  macAddress?: string;
}

export class WxLoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken?: string;

  @ApiProperty({ description: '用户信息' })
  user?: {
    id: number;
    name: string;
    phone: string;
    role: string;
    wechatId: string;
  };

  @ApiProperty({ description: '是否需要绑定手机号' })
  needPhoneBinding?: boolean;

  @ApiProperty({ description: '临时会话标识' })
  tempSessionId?: string;
}
