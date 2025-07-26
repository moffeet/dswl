import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  })
  @IsNotEmpty({ message: 'Refresh Token不能为空' })
  @IsString({ message: 'Refresh Token必须是字符串' })
  refreshToken: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'Access Token (2小时有效)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh Token (7天有效)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access Token过期时间（秒）',
    example: 7200
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Token类型',
    example: 'Bearer'
  })
  tokenType: string;
}

export class LoginWithTokensResponseDto {
  @ApiProperty({
    description: 'Access Token (2小时有效)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh Token (7天有效)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access Token过期时间（秒）',
    example: 7200
  })
  expiresIn: number;

  @ApiProperty({
    description: '用户信息'
  })
  user: {
    id: number;
    name: string;
    phone: string;
    role: string;
  };
}
