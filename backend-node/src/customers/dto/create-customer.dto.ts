import { IsString, IsOptional, MaxLength, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 创建客户DTO
 * 用于接收创建客户的请求参数
 * 只需要提供必要的客户信息，客户编号会自动生成
 */
export class CreateCustomerDto {
  @ApiProperty({
    description: '客户名称，必填字段，最大长度100字符',
    example: '北京华强科技有限公司',
    maxLength: 100,
    required: true
  })
  @IsString()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({
    description: '客户地址（旧字段，保留兼容性），可选字段，最大长度255字符',
    example: '北京市朝阳区建国路88号现代城A座12层',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerAddress?: string;

  @ApiProperty({
    description: '门店地址，可选字段，最大长度255字符',
    example: '北京市朝阳区建国路88号现代城A座12层',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  storeAddress?: string;

  @ApiProperty({
    description: '仓库地址，可选字段，最大长度255字符',
    example: '北京市朝阳区建国路88号现代城B座5层',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  warehouseAddress?: string;

  @ApiProperty({
    description: '门店经度',
    example: 116.4074,
    type: 'number',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  storeLongitude?: number;

  @ApiProperty({
    description: '门店纬度',
    example: 39.9042,
    type: 'number',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  storeLatitude?: number;

  @ApiProperty({
    description: '仓库经度',
    example: 116.4084,
    type: 'number',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  warehouseLongitude?: number;

  @ApiProperty({
    description: '仓库纬度',
    example: 39.9052,
    type: 'number',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  warehouseLatitude?: number;

  @ApiProperty({
    description: '客户状态',
    example: 'active',
    enum: ['active', 'inactive'],
    required: false
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}