import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';

export enum CheckinType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
  VISIT = 'visit',
}

@Entity('checkin_records')
export class CheckinRecord {
  @ApiProperty({ description: '打卡记录ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '司机用户ID' })
  @Column()
  driverId: number;

  @ApiProperty({ description: '客户ID' })
  @Column()
  customerId: number;

  @ApiProperty({ description: '打卡类型', enum: CheckinType })
  @Column({
    type: 'enum',
    enum: CheckinType,
    default: CheckinType.DELIVERY,
  })
  checkinType: CheckinType;

  @ApiProperty({ description: '打卡经度' })
  @Column({ type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @ApiProperty({ description: '打卡纬度' })
  @Column({ type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @ApiProperty({ description: '打卡地址' })
  @Column({ length: 255 })
  address: string;

  @ApiProperty({ description: '照片URL列表' })
  @Column({ type: 'json' })
  photos: string[];

  @ApiProperty({ description: '备注', required: false })
  @Column({ type: 'text', nullable: true })
  remark: string;

  @ApiProperty({ description: '打卡时间' })
  @Column({ type: 'datetime' })
  checkinTime: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;

  // 关联司机
  @ManyToOne(() => User)
  @JoinColumn({ name: 'driverId' })
  driver: User;

  // 关联客户
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
} 