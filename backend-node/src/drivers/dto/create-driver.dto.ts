import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({ description: '用户ID' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '司机编号', example: 'D001' })
  @IsString()
  @MaxLength(50)
  driverCode: string;

  @ApiProperty({ description: '姓名', example: '张三' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ description: '身份证号', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  idCard?: string;

  @ApiProperty({ description: '车牌号', required: false, example: '京A12345' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehicleNumber?: string;

  @ApiProperty({ description: '车型', required: false, example: '小型货车' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleType?: string;
} 