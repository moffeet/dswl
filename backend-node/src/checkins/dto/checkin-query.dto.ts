import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CheckinQueryDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    required: false,
    minimum: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    required: false,
    minimum: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  limit?: number = 10;

  @ApiProperty({
    description: '搜索关键词（打卡人姓名）',
    example: '张三',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: '客户名称搜索',
    example: '深圳科技',
    required: false
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({
    description: '开始时间',
    example: '2025-01-01T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: '开始时间格式不正确' })
  startTime?: string;

  @ApiProperty({
    description: '结束时间',
    example: '2025-01-31T23:59:59.999Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: '结束时间格式不正确' })
  endTime?: string;

  @ApiProperty({
    description: '排序字段',
    example: 'checkinTime',
    required: false,
    enum: ['checkinTime', 'createTime', 'updateTime']
  })
  @IsOptional()
  @IsString()
  @IsEnum(['checkinTime', 'createTime', 'updateTime'], { message: '排序字段不正确' })
  sortBy?: string = 'checkinTime';

  @ApiProperty({
    description: '排序方向',
    example: 'DESC',
    required: false,
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'], { message: '排序方向不正确' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class CheckinListResponseDto {
  @ApiProperty({ description: '响应码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应消息', example: '获取成功' })
  message: string;

  @ApiProperty({
    description: '打卡列表数据',
    type: 'object',
    properties: {
      list: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            wxUserId: { type: 'number', example: 1 },
            wxUserName: { type: 'string', example: '张三' },
            customerId: { type: 'number', example: 1 },
            customerName: { type: 'string', example: '深圳科技有限公司' },
            customerAddress: { type: 'string', example: '深圳市南山区科技园南区A座' },
            checkinLocation: { type: 'string', example: '深圳市南山区科技园南区A座附近' },
            checkinLongitude: { type: 'number', example: 113.9547 },
            checkinLatitude: { type: 'number', example: 22.5431 },
            imageUrl: { type: 'string', example: 'http://localhost:3000/checkins/uploads/checkins/2025/01/09/checkin_1704758400000.jpg' },
            checkinTime: { type: 'string', example: '2025-01-09T10:30:00.000Z' },
            createTime: { type: 'string', example: '2025-01-09T10:30:00.000Z' }
          }
        }
      },
      total: { type: 'number', example: 100 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 10 }
    }
  })
  data: {
    list: any[];
    total: number;
    page: number;
    limit: number;
  };
}
