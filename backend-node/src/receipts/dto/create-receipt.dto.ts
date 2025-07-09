import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, MaxLength, IsDecimal } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 创建签收单DTO
 * 用于小程序用户上传签收单时的数据传输
 */
export class CreateReceiptDto {
  @ApiProperty({
    description: '小程序用户ID',
    example: 1,
    type: 'number'
  })
  @IsNotEmpty({ message: '小程序用户ID不能为空' })
  @Type(() => Number)
  @IsNumber({}, { message: '小程序用户ID必须是数字' })
  wxUserId: number;

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
    description: '图片路径',
    example: 'uploads/receipts/2025/01/09/receipt_1704758400000.jpg',
    maxLength: 500
  })
  @IsNotEmpty({ message: '图片路径不能为空' })
  @IsString({ message: '图片路径必须是字符串' })
  @MaxLength(500, { message: '图片路径长度不能超过500个字符' })
  imagePath: string;

  @ApiProperty({
    description: '图片访问URL',
    example: 'http://localhost:3000/uploads/receipts/2025/01/09/receipt_1704758400000.jpg',
    maxLength: 500
  })
  @IsNotEmpty({ message: '图片访问URL不能为空' })
  @IsString({ message: '图片访问URL必须是字符串' })
  @MaxLength(500, { message: '图片访问URL长度不能超过500个字符' })
  imageUrl: string;

  @ApiProperty({
    description: '上传时间（可选，默认为当前时间）',
    example: '2025-01-09T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  uploadTime?: Date;
}
