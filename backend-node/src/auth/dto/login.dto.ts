import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class WechatLoginDto {
  @ApiProperty({ description: '微信小程序登录code' })
  @IsString()
  code: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '用户信息' })
  user: {
    id: number;
    username: string;
    realName: string;
    userType: string;
    status: string;
  };
} 