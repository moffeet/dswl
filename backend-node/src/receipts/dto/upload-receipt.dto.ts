import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, MaxLength, IsNumberString, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 上传签收单DTO
 * 用于小程序用户上传签收单图片和相关信息
 * 包含签名校验参数
 */
export class UploadReceiptDto {
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
    description: '上传人姓名',
    example: '张三',
    maxLength: 100
  })
  @IsNotEmpty({ message: '上传人姓名不能为空' })
  @IsString({ message: '上传人姓名必须是字符串' })
  @MaxLength(100, { message: '上传人姓名长度不能超过100个字符' })
  wxUserName: string;

  @ApiProperty({
    description: '客户ID（可选）',
    example: 1,
    type: 'number',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '客户ID必须是数字' })
  customerId?: number;

  @ApiProperty({
    description: '客户名称',
    example: '深圳科技有限公司',
    maxLength: 100
  })
  @IsNotEmpty({ message: '客户名称不能为空' })
  @IsString({ message: '客户名称必须是字符串' })
  @MaxLength(100, { message: '客户名称长度不能超过100个字符' })
  customerName: string;

  @ApiProperty({
    description: '客户地址',
    example: '深圳市南山区科技园南区A座',
    maxLength: 500,
    required: false
  })
  @IsOptional()
  @IsString({ message: '客户地址必须是字符串' })
  @MaxLength(500, { message: '客户地址长度不能超过500个字符' })
  customerAddress?: string;

  @ApiProperty({
    description: '上传地点',
    example: '深圳市南山区科技园南区A座附近',
    maxLength: 500,
    required: false
  })
  @IsOptional()
  @IsString({ message: '上传地点必须是字符串' })
  @MaxLength(500, { message: '上传地点长度不能超过500个字符' })
  uploadLocation?: string;

  @ApiProperty({
    description: '上传经度',
    example: 113.9547,
    type: 'number',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '上传经度必须是数字' })
  uploadLongitude?: number;

  @ApiProperty({
    description: '上传纬度',
    example: 22.5431,
    type: 'number',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '上传纬度必须是数字' })
  uploadLatitude?: number;

  @ApiProperty({
    description: '上传图片文件',
    type: 'string',
    format: 'binary'
  })
  file: any; // 文件对象，由multer处理
}

/**
 * 上传签收单响应DTO
 */
export class UploadReceiptResponseDto {
  @ApiProperty({
    description: '签收单ID',
    example: 1,
    type: 'number'
  })
  id: number;

  @ApiProperty({
    description: '图片访问URL',
    example: 'http://localhost:3000/uploads/receipts/2025/01/09/receipt_1704758400000.jpg'
  })
  imageUrl: string;

  @ApiProperty({
    description: '上传时间',
    example: '2025-01-09T10:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  uploadTime: Date;

  @ApiProperty({
    description: '上传人姓名',
    example: '张三'
  })
  wxUserName: string;

  @ApiProperty({
    description: '客户名称',
    example: '深圳科技有限公司'
  })
  customerName: string;
}
