import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDriverDto } from './create-driver.dto';
import { DriverStatus } from '../entities/driver.entity';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  @ApiProperty({ description: '司机状态', enum: DriverStatus, required: false })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
} 