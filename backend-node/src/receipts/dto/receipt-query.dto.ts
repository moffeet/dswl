import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 签收单查询DTO
 * 用于管理后台查询签收单列表
 */
export class ReceiptQueryDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  limit?: number = 10;

  @ApiProperty({
    description: '搜索关键词（上传人姓名）',
    example: '张三',
    maxLength: 100,
    required: false
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiProperty({
    description: '客户名称搜索',
    example: '深圳科技',
    maxLength: 100,
    required: false
  })
  @IsOptional()
  @IsString({ message: '客户名称必须是字符串' })
  @Transform(({ value }) => value?.trim())
  customerName?: string;

  @ApiProperty({
    description: '开始时间（上传时间范围查询）',
    example: '2025-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: '开始时间格式不正确' })
  startTime?: string;

  @ApiProperty({
    description: '结束时间（上传时间范围查询）',
    example: '2025-01-31T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: '结束时间格式不正确' })
  endTime?: string;

  @ApiProperty({
    description: '排序字段',
    example: 'uploadTime',
    enum: ['uploadTime', 'createTime', 'wxUserName', 'customerName'],
    default: 'uploadTime',
    required: false
  })
  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sortBy?: string = 'uploadTime';

  @ApiProperty({
    description: '排序方向',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    required: false
  })
  @IsOptional()
  @IsString({ message: '排序方向必须是字符串' })
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * 签收单列表响应DTO
 */
export class ReceiptListResponseDto {
  @ApiProperty({
    description: '签收单列表',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '签收单ID' },
        wxUserId: { type: 'number', description: '小程序用户ID' },
        wxUserName: { type: 'string', description: '上传人姓名' },
        customerId: { type: 'number', description: '客户ID', nullable: true },
        customerName: { type: 'string', description: '客户名称' },
        customerAddress: { type: 'string', description: '客户地址', nullable: true },
        uploadLocation: { type: 'string', description: '上传地点', nullable: true },
        uploadLongitude: { type: 'number', description: '上传经度', nullable: true },
        uploadLatitude: { type: 'number', description: '上传纬度', nullable: true },
        imagePath: { type: 'string', description: '图片路径' },
        imageUrl: { type: 'string', description: '图片访问URL' },
        uploadTime: { type: 'string', format: 'date-time', description: '上传时间' },
        createTime: { type: 'string', format: 'date-time', description: '创建时间' },
        updateTime: { type: 'string', format: 'date-time', description: '更新时间' }
      }
    }
  })
  list: any[];

  @ApiProperty({
    description: '总数量',
    example: 100,
    type: 'number'
  })
  total: number;

  @ApiProperty({
    description: '当前页码',
    example: 1,
    type: 'number'
  })
  page: number;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    type: 'number'
  })
  limit: number;
}
