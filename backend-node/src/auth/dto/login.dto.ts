import { IsString, MinLength, IsEmail } from 'class-validator';
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
  @ApiProperty({ description: 'JWT访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '用户信息' })
  user: {
    id: number;
    username: string;
    nickname?: string;
    status: string;
    roles?: any[];
    avatar?: string;
    phone?: string;
    email?: string;
  };
}

export class LogoutResponseDto {
  @ApiProperty({ description: '登出消息' })
  message: string;
} 