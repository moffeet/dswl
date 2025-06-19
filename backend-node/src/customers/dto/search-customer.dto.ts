import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SearchCustomerDto {
  @ApiProperty({ description: '客户编号', required: false })
  @IsOptional()
  @IsString()
  customerNumber?: string;

  @ApiProperty({ description: '客户名称', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ description: '客户地址', required: false })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({ description: '联系人', required: false })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiProperty({ description: '所属区域', required: false })
  @IsOptional()
  @IsString()
  area?: string;

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

export class CustomerSearchResultDto {
  @ApiProperty({ description: '客户ID' })
  id: number;

  @ApiProperty({ description: '客户编号' })
  customerCode: string;

  @ApiProperty({ description: '客户名称' })
  customerName: string;

  @ApiProperty({ description: '联系人' })
  contactPerson: string;

  @ApiProperty({ description: '联系电话' })
  phone: string;

  @ApiProperty({ description: '地址' })
  address: string;

  @ApiProperty({ description: '经度' })
  longitude: number;

  @ApiProperty({ description: '纬度' })
  latitude: number;
} 