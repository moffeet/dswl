import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 搜索客户DTO
 * 用于客户搜索和筛选功能
 * 支持按客户编号、名称、地址进行模糊匹配
 */
export class SearchCustomerDto {
  @ApiProperty({ 
    description: '客户编号，支持模糊匹配', 
    example: 'C001',
    required: false
  })
  @IsOptional()
  @IsString()
  customerNumber?: string;

  @ApiProperty({ 
    description: '客户名称，支持模糊匹配', 
    example: '科技',
    required: false
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ 
    description: '客户地址，支持模糊匹配', 
    example: '深圳',
    required: false
  })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({ 
    description: '页码，从1开始', 
    example: 1, 
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({ 
    description: '每页数量，范围1-100', 
    example: 10, 
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}

/**
 * 客户搜索结果DTO
 * 定义搜索返回的客户数据结构
 */
export class CustomerSearchResultDto {
  @ApiProperty({ 
    description: '客户ID', 
    example: 1
  })
  id: number;

  @ApiProperty({ 
    description: '客户编号', 
    example: 'C001'
  })
  customerNumber: string;

  @ApiProperty({ 
    description: '客户名称', 
    example: '深圳科技有限公司'
  })
  customerName: string;

  @ApiProperty({ 
    description: '客户地址', 
    example: '深圳市南山区科技园南区'
  })
  customerAddress: string;

  @ApiProperty({ 
    description: '更新人', 
    example: '管理员'
  })
  updateBy: string;

  @ApiProperty({ 
    description: '创建时间', 
    example: '2025-06-27T06:16:28.000Z'
  })
  createTime: Date;

  @ApiProperty({ 
    description: '更新时间', 
    example: '2025-06-27T08:16:28.000Z'
  })
  updateTime: Date;
} 