import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { WxUserRole } from '../entities/wx-user.entity';

export class WxUserQueryDto {
  @ApiProperty({ 
    description: '页码', 
    example: 1, 
    required: false,
    default: 1 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({ 
    description: '每页数量', 
    example: 10, 
    required: false,
    default: 10 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @ApiProperty({ 
    description: '姓名搜索', 
    example: '张三',
    required: false 
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: '手机号搜索', 
    example: '138',
    required: false 
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    description: '角色筛选', 
    enum: WxUserRole,
    required: false 
  })
  @IsOptional()
  @IsEnum(WxUserRole)
  role?: WxUserRole;

  @ApiProperty({ 
    description: '微信ID搜索', 
    example: 'wx_',
    required: false 
  })
  @IsOptional()
  @IsString()
  wechatId?: string;
}
