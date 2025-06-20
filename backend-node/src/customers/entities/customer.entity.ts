import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('t_customer')
export class Customer {
  @ApiProperty({ description: '客户ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '客户编码' })
  @Column({ name: 'customer_code', length: 50, unique: true })
  customerNumber: string;

  @ApiProperty({ description: '客户名称' })
  @Column({ name: 'customer_name', length: 100 })
  customerName: string;

  @ApiProperty({ description: '联系人' })
  @Column({ name: 'contact_person', length: 50, nullable: true })
  contactPerson: string;

  @ApiProperty({ description: '联系电话' })
  @Column({ name: 'phone', length: 20, nullable: true })
  contactPhone: string;

  @ApiProperty({ description: '详细地址' })
  @Column({ name: 'address', length: 200, nullable: true })
  customerAddress: string;

  @ApiProperty({ description: '经度' })
  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @ApiProperty({ description: '纬度' })
  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @ApiProperty({ description: '省份' })
  @Column({ name: 'province', length: 50, nullable: true })
  province: string;

  @ApiProperty({ description: '城市' })
  @Column({ name: 'city', length: 50, nullable: true })
  city: string;

  @ApiProperty({ description: '区县' })
  @Column({ name: 'district', length: 50, nullable: true })
  district: string;

  @ApiProperty({ description: '所属区域' })
  @Column({ name: 'area', length: 50, nullable: true })
  area: string;

  @ApiProperty({ description: '客户类型' })
  @Column({ name: 'customer_type', length: 20, nullable: true })
  customerType: string;

  @ApiProperty({ description: '是否启用' })
  @Column({ name: 'enabled', type: 'tinyint', default: 1 })
  status: string;

  @ApiProperty({ description: '更新人' })
  @Column({ name: 'update_by', length: 50, nullable: true })
  updateBy: string;

  @ApiProperty({ description: '备注' })
  @Column({ name: 'remark', type: 'text', nullable: true })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date;
} 