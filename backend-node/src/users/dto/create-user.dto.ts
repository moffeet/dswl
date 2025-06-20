import { IsString, IsEmail, IsEnum, IsOptional, IsPhoneNumber, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType, UserStatus } from '../entities/user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: '真实姓名', example: '张三' })
  @IsString()
  @MaxLength(50)
  realName: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: '性别', enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: '昵称', example: '小张' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ description: '用户类型', enum: UserType, example: UserType.DRIVER })
  @IsEnum(UserType)
  userType: UserType;

  @ApiPropertyOptional({ description: '用户状态', enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ description: '微信OpenID' })
  @IsString()
  @IsOptional()
  wechatOpenid?: string;

  @ApiPropertyOptional({ description: '司机编号' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  driverCode?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsString()
  @IsOptional()
  avatar?: string;
} 