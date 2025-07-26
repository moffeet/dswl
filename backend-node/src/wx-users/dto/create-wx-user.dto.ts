import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { WxUserRole } from '../entities/wx-user.entity';

export class CreateWxUserDto {
  @ApiProperty({
    description: '姓名',
    example: '张三',
    required: true
  })
  @IsNotEmpty({ message: '姓名不能为空' })
  @IsString({ message: '姓名必须是字符串' })
  name: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138001',
    required: true
  })
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsString({ message: '手机号必须是字符串' })
  phone: string;

  @ApiProperty({
    description: '角色',
    enum: WxUserRole,
    example: WxUserRole.DRIVER,
    required: true
  })
  @IsNotEmpty({ message: '角色不能为空' })
  @IsEnum(WxUserRole, { message: '角色必须是司机或销售' })
  role: WxUserRole;

  @ApiProperty({
    description: '微信ID',
    example: 'wx_zhangsan',
    required: false
  })
  @IsOptional()
  @IsString({ message: '微信ID必须是字符串' })
  wechatId?: string;

  @ApiProperty({
    description: '设备唯一标识',
    example: 'device_12345678',
    required: false
  })
  @IsOptional()
  @IsString({ message: '设备标识必须是字符串' })
  deviceId?: string;
}
