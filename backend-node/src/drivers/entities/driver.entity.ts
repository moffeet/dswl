import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum DriverStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

@Entity('drivers')
export class Driver {
  @ApiProperty({ description: '司机ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Column({ unique: true })
  userId: number;

  @ApiProperty({ description: '司机编号' })
  @Column({ length: 50, unique: true })
  driverCode: string;

  @ApiProperty({ description: '姓名' })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ description: '手机号' })
  @Column({ length: 20 })
  phone: string;

  @ApiProperty({ description: '身份证号', required: false })
  @Column({ length: 20, nullable: true })
  idCard: string;

  @ApiProperty({ description: '车牌号', required: false })
  @Column({ length: 20, nullable: true })
  vehicleNumber: string;

  @ApiProperty({ description: '车型', required: false })
  @Column({ length: 50, nullable: true })
  vehicleType: string;

  @ApiProperty({ description: '司机状态', enum: DriverStatus })
  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.OFFLINE,
  })
  status: DriverStatus;

  @ApiProperty({ description: '当前经度', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  currentLongitude: number;

  @ApiProperty({ description: '当前纬度', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  currentLatitude: number;

  @ApiProperty({ description: '最后位置更新时间', required: false })
  @Column({ type: 'datetime', nullable: true })
  lastLocationUpdateAt: Date;

  @ApiProperty({ description: '是否启用' })
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;

  // 关联用户
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
} 