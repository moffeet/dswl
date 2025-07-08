import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @Length(2, 50, { message: '用户名长度必须在2-50个字符之间' })
  username: string;

  @ApiPropertyOptional({ description: '密码（可选，不提供时使用用户名作为密码）', example: '123456' })
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @Length(6, 20, { message: '密码长度必须在6-20个字符之间' })
  password?: string;

  @ApiProperty({ description: '昵称', example: '张三' })
  @IsNotEmpty({ message: '昵称不能为空' })
  @IsString({ message: '昵称必须是字符串' })
  @Length(1, 50, { message: '昵称长度必须在1-50个字符之间' })
  nickname: string;



  @ApiPropertyOptional({ description: '角色ID', type: Number, example: 1 })
  @IsOptional()
  roleId?: number;
} 