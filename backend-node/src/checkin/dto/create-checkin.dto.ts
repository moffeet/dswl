import { IsString, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CheckinType } from '../entities/checkin-record.entity';

export class CreateCheckinDto {
  @ApiProperty({ description: '客户ID' })
  @IsNumber()
  customerId: number;

  @ApiProperty({ description: '打卡类型', enum: CheckinType })
  @IsEnum(CheckinType)
  checkinType: CheckinType;

  @ApiProperty({ description: '打卡经度', example: 116.404 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude: number;

  @ApiProperty({ description: '打卡纬度', example: 39.915 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @ApiProperty({ description: '打卡地址' })
  @IsString()
  address: string;

  @ApiProperty({ description: '照片URL列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  photos: string[];

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
} 