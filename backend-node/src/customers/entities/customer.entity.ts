import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 客户实体
 * 对应数据库表：t_customers
 * 用于管理系统中的客户信息
 */
@Entity('t_customers')
export class Customer {
  @ApiProperty({ 
    description: '客户ID，主键，自动递增', 
    example: 1,
    type: 'number'
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ 
    description: '客户编号，系统自动生成，格式：C001、C002...，全局唯一', 
    example: 'C001',
    maxLength: 50,
    uniqueItems: true
  })
  @Column({ name: 'customerNumber', length: 50, unique: true })
  customerNumber: string;

  @ApiProperty({ 
    description: '客户名称，必填字段', 
    example: '深圳科技有限公司',
    maxLength: 100
  })
  @Column({ name: 'customerName', length: 100 })
  customerName: string;

  @ApiProperty({
    description: '门店地址',
    example: '深圳市南山区科技园南区A座',
    maxLength: 255,
    required: false
  })
  @Column({ name: 'storeAddress', length: 255, nullable: true })
  storeAddress: string;

  @ApiProperty({
    description: '仓库地址',
    example: '深圳市南山区科技园南区B座',
    maxLength: 255,
    required: false
  })
  @Column({ name: 'warehouseAddress', length: 255, nullable: true })
  warehouseAddress: string;

  @ApiProperty({
    description: '门店经度',
    example: 113.9547,
    type: 'number',
    required: false
  })
  @Column({ name: 'storeLongitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  storeLongitude: number;

  @ApiProperty({
    description: '门店纬度',
    example: 22.5431,
    type: 'number',
    required: false
  })
  @Column({ name: 'storeLatitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  storeLatitude: number;

  @ApiProperty({
    description: '仓库经度',
    example: 113.9557,
    type: 'number',
    required: false
  })
  @Column({ name: 'warehouseLongitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  warehouseLongitude: number;

  @ApiProperty({
    description: '仓库纬度',
    example: 22.5441,
    type: 'number',
    required: false
  })
  @Column({ name: 'warehouseLatitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  warehouseLatitude: number;

  @ApiProperty({
    description: '客户状态',
    example: 'active',
    enum: ['active', 'inactive'],
    required: false
  })
  @Column({ name: 'status', type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: 'active' | 'inactive';

  @ApiProperty({
    description: '最后同步时间',
    example: '2025-06-27T08:16:28.000Z',
    type: 'string',
    format: 'date-time',
    required: false
  })
  @Column({ name: 'lastSyncTime', type: 'datetime', nullable: true })
  lastSyncTime: Date;

  @ApiProperty({
    description: '更新人，记录最后修改该客户信息的用户',
    example: '管理员',
    maxLength: 50,
    required: false
  })
  @Column({ name: 'updateBy', length: 50, nullable: true })
  updateBy: string;

  @ApiProperty({
    description: '创建时间，记录自动生成',
    example: '2025-06-27T06:16:28.000Z',
    type: 'string',
    format: 'date-time'
  })
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间，每次修改时自动更新',
    example: '2025-06-27T08:16:28.000Z',
    type: 'string',
    format: 'date-time'
  })
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
} 