import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateLocationDto {
  @ApiProperty({ description: '经度', example: 116.404 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude: number;

  @ApiProperty({ description: '纬度', example: 39.915 })
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @ApiProperty({ description: '地址描述', required: false })
  @IsOptional()
  @IsString()
  address?: string;
} 