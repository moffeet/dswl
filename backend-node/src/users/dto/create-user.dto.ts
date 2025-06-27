import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @Length(2, 50, { message: '用户名长度必须在2-50个字符之间' })
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @Length(6, 20, { message: '密码长度必须在6-20个字符之间' })
  password: string;

  @ApiPropertyOptional({ description: '昵称', example: '张三' })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @Length(1, 50, { message: '昵称长度必须在1-50个字符之间' })
  nickname?: string;

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({ description: '性别', enum: ['male', 'female'], example: 'male' })
  @IsOptional()
  @IsEnum(['male', 'female'], { message: '性别只能是male或female' })
  gender?: 'male' | 'female';

  @ApiPropertyOptional({ description: '用户状态', enum: ['normal', 'disabled'], example: 'normal' })
  @IsOptional()
  @IsEnum(['normal', 'disabled'], { message: '用户状态只能是normal或disabled' })
  status?: 'normal' | 'disabled';

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString({ message: '头像URL必须是字符串' })
  avatar?: string;

  @ApiPropertyOptional({ description: '角色ID列表', type: [Number], example: [1, 2] })
  @IsOptional()
  roleIds?: number[];
} 