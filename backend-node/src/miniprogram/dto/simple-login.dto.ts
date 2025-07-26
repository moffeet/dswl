import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
    description: '设备唯一标识（MAC地址或设备ID）',
    example: 'AA:BB:CC:DD:EE:FF',
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
