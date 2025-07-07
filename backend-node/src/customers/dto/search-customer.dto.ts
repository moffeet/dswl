import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 搜索客户DTO
 * 用于客户搜索和筛选功能
 * 支持按客户编号、名称进行模糊匹配，默认按更新时间倒序排列
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
 * 只返回列表页面需要的字段
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
    description: '门店地址',
    example: '深圳市南山区科技园南区A座',
    required: false
  })
  storeAddress?: string;

  @ApiProperty({
    description: '仓库地址',
    example: '深圳市南山区科技园南区B座',
    required: false
  })
  warehouseAddress?: string;

  @ApiProperty({
    description: '门店经度',
    example: 113.9547,
    type: 'number',
    required: false
  })
  storeLongitude?: number;

  @ApiProperty({
    description: '门店纬度',
    example: 22.5431,
    type: 'number',
    required: false
  })
  storeLatitude?: number;

  @ApiProperty({
    description: '仓库经度',
    example: 113.9557,
    type: 'number',
    required: false
  })
  warehouseLongitude?: number;

  @ApiProperty({
    description: '仓库纬度',
    example: 22.5441,
    type: 'number',
    required: false
  })
  warehouseLatitude?: number;

  @ApiProperty({
    description: '更新人',
    example: '管理员',
    required: false
  })
  updateBy?: string;

  @ApiProperty({
    description: '客户状态（仅超级管理员可见）',
    example: 'active',
    required: false
  })
  status?: 'active' | 'inactive';

  @ApiProperty({
    description: '更新时间（同步时间）',
    example: '2025-06-27T08:16:28.000Z'
  })
  updatedAt: Date;
}

/**
 * 客户列表查询DTO
 * 用于客户列表接口的查询参数
 */
export class CustomerListQueryDto {
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
 * 客户搜索响应DTO
 */
export class CustomerSearchResponseDto {
  @ApiProperty({
    description: '客户列表',
    type: [CustomerSearchResultDto]
  })
  data: CustomerSearchResultDto[];

  @ApiProperty({
    description: '总记录数',
    example: 100
  })
  total: number;

  @ApiProperty({
    description: '当前页码',
    example: 1
  })
  page: number;

  @ApiProperty({
    description: '每页数量',
    example: 10
  })
  limit: number;

  @ApiProperty({
    description: '总页数',
    example: 10
  })
  totalPages: number;
}