import { IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @ApiProperty({ description: '客户名称', example: '北京华强科技有限公司' })
  @IsString()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ description: '联系人', example: '张经理', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPerson?: string;

  @ApiProperty({ description: '联系电话', example: '13800138001', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiProperty({ description: '详细地址', example: '北京市朝阳区建国路88号', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customerAddress?: string;

  @ApiProperty({ description: '经度', example: 116.404, required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude?: number;

  @ApiProperty({ description: '纬度', example: 39.915, required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude?: number;

  @ApiProperty({ description: '省份', example: '北京市', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  province?: string;

  @ApiProperty({ description: '城市', example: '北京市', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string;

  @ApiProperty({ description: '区县', example: '朝阳区', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  district?: string;

  @ApiProperty({ description: '所属区域', example: '华北', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  area?: string;

  @ApiProperty({ description: '客户类型', example: '企业客户', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerType?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
} 