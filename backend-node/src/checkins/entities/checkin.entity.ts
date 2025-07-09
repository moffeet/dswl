import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { WxUser } from '../../wx-users/entities/wx-user.entity';
import { Customer } from '../../customers/entities/customer.entity';

/**
 * 打卡实体
 * 对应数据库表：t_checkins
 * 用于管理小程序司机的打卡记录
 */
@Entity('t_checkins')
export class Checkin {
  @ApiProperty({ 
    description: '打卡ID，主键，自动递增', 
    example: 1,
    type: 'number'
  })
  @PrimaryGeneratedColumn({ comment: '打卡ID' })
  id: number;

  @ApiProperty({ 
    description: '小程序用户ID', 
    example: 1,
    type: 'number'
  })
  @Column({ name: 'wx_user_id', type: 'bigint', comment: '小程序用户ID' })
  wxUserId: number;

  @ApiProperty({ 
    description: '打卡人姓名', 
    example: '张三',
    maxLength: 100
  })
  @Column({ name: 'wx_user_name', length: 100, comment: '打卡人姓名' })
  wxUserName: string;

  @ApiProperty({ 
    description: '客户ID（可能为空，如果客户被删除）', 
    example: 1,
    type: 'number',
    required: false
  })
  @Column({ name: 'customer_id', type: 'bigint', nullable: true, comment: '客户ID（可能为空，如果客户被删除）' })
  customerId?: number;

  @ApiProperty({ 
    description: '客户名称', 
    example: '深圳科技有限公司',
    maxLength: 100
  })
  @Column({ name: 'customer_name', length: 100, comment: '客户名称' })
  customerName: string;

  @ApiProperty({
    description: '客户地址',
    example: '深圳市南山区科技园南区A座',
    maxLength: 500,
    required: false
  })
  @Column({ name: 'customer_address', length: 500, nullable: true, comment: '客户地址' })
  customerAddress?: string;

  @ApiProperty({
    description: '打卡地点',
    example: '深圳市南山区科技园南区A座附近',
    maxLength: 500,
    required: false
  })
  @Column({ name: 'checkin_location', length: 500, nullable: true, comment: '打卡地点' })
  checkinLocation?: string;

  @ApiProperty({
    description: '打卡经度',
    example: 113.9547,
    type: 'number',
    required: false
  })
  @Column({ name: 'checkin_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true, comment: '打卡经度' })
  checkinLongitude?: number;

  @ApiProperty({
    description: '打卡纬度',
    example: 22.5431,
    type: 'number',
    required: false
  })
  @Column({ name: 'checkin_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true, comment: '打卡纬度' })
  checkinLatitude?: number;

  @ApiProperty({
    description: '图片路径',
    example: 'uploads/checkins/2025/01/09/checkin_1704758400000.jpg',
    maxLength: 500
  })
  @Column({ name: 'image_path', length: 500, comment: '图片路径' })
  imagePath: string;

  @ApiProperty({
    description: '图片访问URL',
    example: 'http://localhost:3000/checkins/uploads/checkins/2025/01/09/checkin_1704758400000.jpg',
    maxLength: 500
  })
  @Column({ name: 'image_url', length: 500, comment: '图片访问URL' })
  imageUrl: string;

  @ApiProperty({
    description: '打卡时间',
    example: '2025-01-09T10:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @Column({ name: 'checkin_time', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', comment: '打卡时间' })
  checkinTime: Date;

  @ApiProperty({
    description: '是否删除',
    example: 0,
    type: 'number',
    required: false
  })
  @Column({ name: 'is_deleted', type: 'tinyint', width: 1, default: 0, comment: '是否删除：0-未删除，1-已删除' })
  isDeleted: number;

  @ApiProperty({
    description: '创建时间，记录自动生成',
    example: '2025-01-09T10:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  createTime: Date;

  @ApiProperty({
    description: '更新时间，每次修改时自动更新',
    example: '2025-01-09T10:30:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  @UpdateDateColumn({ name: 'update_time', comment: '更新时间' })
  updateTime: Date;

  // 关联关系
  @ManyToOne(() => WxUser, { nullable: true })
  @JoinColumn({ name: 'wx_user_id' })
  wxUser?: WxUser;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;
}
