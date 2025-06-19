import { IsString, IsEnum, IsOptional, IsPhoneNumber, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'driver001' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
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

  @ApiProperty({ description: '用户类型', enum: UserType, example: UserType.DRIVER })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ description: '微信OpenID', required: false })
  @IsOptional()
  @IsString()
  wechatOpenid?: string;

  @ApiProperty({ description: '司机编号', required: false, example: 'D001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  driverCode?: string;
} 