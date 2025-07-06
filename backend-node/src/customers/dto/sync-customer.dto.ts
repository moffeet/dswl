import { IsOptional, IsArray, IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 同步客户DTO
 * 用于客户数据同步功能
 */
export class SyncCustomerDto {
  @ApiProperty({ 
    description: '要同步的客户ID列表，如果不提供则同步所有客户', 
    example: [1, 2, 3],
    type: [Number],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  customerIds?: number[];
}

/**
 * 批量删除客户DTO
 */
export class BatchDeleteCustomerDto {
  @ApiProperty({ 
    description: '要删除的客户ID列表', 
    example: [1, 2, 3],
    type: [Number],
    required: true
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  customerIds: number[];
}

/**
 * 地理编码请求DTO
 */
export class GeocodeRequestDto {
  @ApiProperty({
    description: '地址字符串',
    example: '深圳市南山区科技园南区',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}

/**
 * 逆地理编码请求DTO
 */
export class ReverseGeocodeRequestDto {
  @ApiProperty({
    description: '经度',
    example: 113.9547,
    type: 'number',
    required: true
  })
  @IsNumber({}, { message: '经度必须是数字' })
  @Type(() => Number)
  longitude: number;

  @ApiProperty({
    description: '纬度',
    example: 22.5431,
    type: 'number',
    required: true
  })
  @IsNumber({}, { message: '纬度必须是数字' })
  @Type(() => Number)
  latitude: number;
}

/**
 * 地理编码响应DTO
 */
export class GeocodeResponseDto {
  @ApiProperty({ 
    description: '地址', 
    example: '深圳市南山区科技园南区'
  })
  address: string;

  @ApiProperty({ 
    description: '经度', 
    example: 113.9547
  })
  longitude: number;

  @ApiProperty({ 
    description: '纬度', 
    example: 22.5431
  })
  latitude: number;

  @ApiProperty({ 
    description: '省份', 
    example: '广东省'
  })
  province: string;

  @ApiProperty({ 
    description: '城市', 
    example: '深圳市'
  })
  city: string;

  @ApiProperty({
    description: '区县',
    example: '南山区'
  })
  district: string;
}

/**
 * 外部系统客户数据DTO
 */
export class ExternalCustomerDto {
  @ApiProperty({
    description: '客户编码',
    example: 'C001',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  customerNumber: string;

  @ApiProperty({
    description: '客户名称',
    example: '深圳科技有限公司',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  customerName: string;


}
