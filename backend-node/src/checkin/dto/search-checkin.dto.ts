import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CheckinType } from '../entities/checkin-record.entity';

export class SearchCheckinDto {
  @ApiProperty({ description: '司机ID', required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  driverId?: number;

  @ApiProperty({ description: '客户ID', required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  customerId?: number;

  @ApiProperty({ description: '打卡类型', enum: CheckinType, required: false })
  @IsOptional()
  @IsEnum(CheckinType)
  checkinType?: CheckinType;

  @ApiProperty({ description: '开始日期', example: '2024-01-01', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: '结束日期', example: '2024-01-31', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ description: '页码', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({ description: '每页数量', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
} 