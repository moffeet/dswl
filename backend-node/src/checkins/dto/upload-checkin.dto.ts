import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadCheckinDto {
  @ApiProperty({
    description: '打卡人姓名',
    example: '张三',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty({ message: '打卡人姓名不能为空' })
  @MaxLength(100, { message: '打卡人姓名长度不能超过100个字符' })
  wxUserName: string;

  @ApiProperty({
    description: '客户名称',
    example: '深圳科技有限公司',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty({ message: '客户名称不能为空' })
  @MaxLength(100, { message: '客户名称长度不能超过100个字符' })
  customerName: string;

  @ApiProperty({
    description: '客户地址',
    example: '深圳市南山区科技园南区A座',
    maxLength: 500,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '客户地址长度不能超过500个字符' })
  customerAddress?: string;

  @ApiProperty({
    description: '打卡地点',
    example: '深圳市南山区科技园南区A座附近',
    maxLength: 500,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '打卡地点长度不能超过500个字符' })
  checkinLocation?: string;

  @ApiProperty({
    description: '打卡经度',
    example: 113.9547,
    type: 'number',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber({}, { message: '打卡经度必须是数字' })
  checkinLongitude?: number;

  @ApiProperty({
    description: '打卡纬度',
    example: 22.5431,
    type: 'number',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber({}, { message: '打卡纬度必须是数字' })
  checkinLatitude?: number;

  @ApiProperty({
    description: '打卡图片文件',
    type: 'string',
    format: 'binary'
  })
  file: any;
}

export class UploadCheckinResponseDto {
  @ApiProperty({ description: '响应码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应消息', example: '打卡成功' })
  message: string;

  @ApiProperty({
    description: '打卡数据',
    type: 'object',
    properties: {
      id: { type: 'number', example: 1 },
      imageUrl: { type: 'string', example: 'http://localhost:3000/checkins/uploads/checkins/2025/01/09/checkin_1704758400000.jpg' },
      checkinTime: { type: 'string', example: '2025-01-09T10:30:00.000Z' },
      wxUserName: { type: 'string', example: '张三' },
      customerName: { type: 'string', example: '深圳科技有限公司' },
      checkinLocation: { type: 'string', example: '深圳市南山区科技园南区A座附近' }
    }
  })
  data: {
    id: number;
    imageUrl: string;
    checkinTime: Date;
    wxUserName: string;
    customerName: string;
    checkinLocation?: string;
  };
}
