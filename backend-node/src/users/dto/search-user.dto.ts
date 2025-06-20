import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserType } from '../entities/user.entity';

export class SearchUserDto {
  @ApiPropertyOptional({ description: '页码', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '用户名搜索' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: '真实姓名搜索' })
  @IsString()
  @IsOptional()
  realName?: string;

  @ApiPropertyOptional({ description: '手机号搜索' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱搜索' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: '用户类型筛选', enum: UserType })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;
} 