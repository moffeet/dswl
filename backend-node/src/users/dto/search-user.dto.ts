import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchUserDto {
  @ApiPropertyOptional({ description: '用户名', example: 'admin' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '昵称', example: '张三' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'user@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: '性别', enum: ['男', '女'], example: '男' })
  @IsOptional()
  @IsEnum(['男', '女'])
  gender?: '男' | '女';

  @ApiPropertyOptional({ description: '用户状态', enum: ['启用', '禁用'], example: '启用' })
  @IsOptional()
  @IsEnum(['启用', '禁用'])
  status?: '启用' | '禁用';

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, default: 10 })
  @IsOptional()
  size?: number = 10;
} 