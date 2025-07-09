import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MaxLength, IsNumber, IsNumberString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class WxUpdateCustomerDto {
  @ApiProperty({
    description: '小程序用户ID',
    example: 1,
    type: 'number'
  })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: '用户ID必须是数字' })
  wxUserId: number;

  @ApiProperty({
    description: '时间戳（毫秒）',
    example: '1704387123456',
    required: true
  })
  @IsNotEmpty({ message: '时间戳不能为空' })
  @IsNumberString({}, { message: '时间戳必须是数字字符串' })
  timestamp: string;

  @ApiProperty({
    description: '随机数（防重放攻击）',
    example: 'abc123def456',
    required: true,
    minLength: 8
  })
  @IsNotEmpty({ message: '随机数不能为空' })
  @IsString({ message: '随机数必须是字符串' })
  @MinLength(8, { message: '随机数长度不能少于8位' })
  nonce: string;

  @ApiProperty({
    description: '签名值（HMAC-SHA256）',
    example: 'a1b2c3d4e5f6...',
    required: true
  })
  @IsNotEmpty({ message: '签名不能为空' })
  @IsString({ message: '签名必须是字符串' })
  signature: string;
  @ApiProperty({
    description: '操作人姓名',
    example: '张三',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty({ message: '操作人姓名不能为空' })
  @MaxLength(100, { message: '操作人姓名长度不能超过100个字符' })
  operatorName: string;

  @ApiProperty({
    description: '客户编号',
    example: 'C001',
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty({ message: '客户编号不能为空' })
  @MaxLength(50, { message: '客户编号长度不能超过50个字符' })
  customerNumber: string;

  @ApiProperty({
    description: '门店地址',
    example: '深圳市南山区科技园南区A座',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '门店地址长度不能超过255个字符' })
  storeAddress?: string;

  @ApiProperty({
    description: '仓库地址',
    example: '深圳市南山区科技园南区B座',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '仓库地址长度不能超过255个字符' })
  warehouseAddress?: string;
}

export class WxUpdateCustomerResponseDto {
  @ApiProperty({ description: '响应码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应消息', example: '客户信息更新成功' })
  message: string;

  @ApiProperty({
    description: '更新后的客户数据',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      customerNumber: { type: 'string', example: 'C001' },
      customerName: { type: 'string', example: '深圳科技有限公司' },
      storeAddress: { type: 'string', example: '深圳市南山区科技园南区A座' },
      warehouseAddress: { type: 'string', example: '深圳市南山区科技园南区B座' },
      storeLongitude: { type: 'number', example: 113.9547 },
      storeLatitude: { type: 'number', example: 22.5431 },
      warehouseLongitude: { type: 'number', example: 113.9557 },
      warehouseLatitude: { type: 'number', example: 22.5441 },
      updateBy: { type: 'string', example: '张三' },
      updatedAt: { type: 'string', example: '2025-01-09T10:30:00.000Z' }
    }
  })
  data: {
    id: number;
    customerNumber: string;
    customerName: string;
    storeAddress?: string;
    warehouseAddress?: string;
    storeLongitude?: number;
    storeLatitude?: number;
    warehouseLongitude?: number;
    warehouseLatitude?: number;
    updateBy?: string;
    updatedAt: Date;
  };
}
