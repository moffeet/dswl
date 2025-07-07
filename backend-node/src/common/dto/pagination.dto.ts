import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 分页查询基类DTO
 * 提供通用的分页参数
 */
export class PaginationDto {
  @ApiProperty({
    description: '页码，从1开始',
    example: 1,
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({
    description: '每页数量，范围1-100',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}

/**
 * 用户查询DTO
 * 继承分页功能，添加用户特定的查询参数
 */
export class UserQueryDto extends PaginationDto {
  @ApiProperty({
    description: '用户名，支持模糊匹配',
    example: 'admin',
    required: false
  })
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: '昵称，支持模糊匹配',
    example: '管理员',
    required: false
  })
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    description: '手机号，支持模糊匹配',
    example: '138',
    required: false
  })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: '邮箱，支持模糊匹配',
    example: 'admin',
    required: false
  })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: '性别',
    enum: ['male', 'female'],
    required: false
  })
  @IsOptional()
  gender?: 'male' | 'female';

  @ApiProperty({
    description: '用户状态',
    enum: ['normal', 'disabled'],
    required: false
  })
  @IsOptional()
  status?: 'normal' | 'disabled';
}

/**
 * 权限查询DTO
 * 继承分页功能，添加权限特定的查询参数
 */
export class PermissionQueryDto extends PaginationDto {
  @ApiProperty({
    description: '权限名称，支持模糊匹配',
    example: '用户',
    required: false
  })
  @IsOptional()
  permissionName?: string;

  @ApiProperty({
    description: '权限编码，支持模糊匹配',
    example: 'menu.system',
    required: false
  })
  @IsOptional()
  permissionCode?: string;

  @ApiProperty({
    description: '权限类型',
    enum: ['menu', 'button'],
    required: false
  })
  @IsOptional()
  permissionType?: 'menu' | 'button';

  @ApiProperty({
    description: '权限状态',
    enum: ['normal', 'disabled'],
    required: false
  })
  @IsOptional()
  status?: 'normal' | 'disabled';
}

/**
 * 角色查询DTO
 * 继承分页功能，添加角色特定的查询参数
 */
export class RoleQueryDto extends PaginationDto {
  @ApiProperty({
    description: '角色名称，支持模糊匹配',
    example: '管理员',
    required: false
  })
  @IsOptional()
  roleName?: string;

  @ApiProperty({
    description: '角色编码，支持模糊匹配',
    example: 'admin',
    required: false
  })
  @IsOptional()
  roleCode?: string;

  @ApiProperty({
    description: '角色状态',
    enum: ['启用', '禁用'],
    required: false
  })
  @IsOptional()
  status?: '启用' | '禁用';

  @ApiProperty({
    description: '是否启用小程序登录',
    example: true,
    required: false
  })
  @IsOptional()
  miniAppLoginEnabled?: boolean;
}
