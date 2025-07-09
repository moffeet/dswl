import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 上传签收单DTO
 * 用于小程序用户上传签收单图片和相关信息
 */
export class UploadReceiptDto {
  @ApiProperty({
    description: '小程序用户微信ID',
    example: 'wx_zhangsan',
    maxLength: 100
  })
  @IsNotEmpty({ message: '微信ID不能为空' })
  @IsString({ message: '微信ID必须是字符串' })
  @MaxLength(100, { message: '微信ID长度不能超过100个字符' })
  wechatId: string;

  @ApiProperty({
    description: 'MAC地址',
    example: '00:11:22:33:44:55',
    maxLength: 50
  })
  @IsNotEmpty({ message: 'MAC地址不能为空' })
  @IsString({ message: 'MAC地址必须是字符串' })
  @MaxLength(50, { message: 'MAC地址长度不能超过50个字符' })
  macAddress: string;

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
