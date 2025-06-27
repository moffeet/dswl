import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建客户DTO
 * 用于接收创建客户的请求参数
 * 只需要提供必要的客户信息，客户编号会自动生成
 */
export class CreateCustomerDto {
  @ApiProperty({ 
    description: '客户名称，必填字段，最大长度100字符', 
    example: '北京华强科技有限公司',
    maxLength: 100,
    required: true
  })
  @IsString()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ 
    description: '客户地址，可选字段，最大长度255字符', 
    example: '北京市朝阳区建国路88号现代城A座12层',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerAddress?: string;
} 