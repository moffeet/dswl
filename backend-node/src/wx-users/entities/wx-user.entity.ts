import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum WxUserRole {
  DRIVER = '司机',
  SALES = '销售'
}

@Entity('t_wx_users')
export class WxUser {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn({ comment: '用户ID' })
  id: number;

  @ApiProperty({ description: '姓名' })
  @Column({ length: 100, comment: '姓名' })
  name: string;

  @ApiProperty({ description: '手机号' })
  @Column({ length: 20, unique: true, comment: '手机号（唯一）' })
  phone: string;

  @ApiProperty({ description: '角色', enum: WxUserRole })
  @Column({ type: 'enum', enum: WxUserRole, comment: '角色：司机/销售' })
  role: WxUserRole;

  @ApiProperty({ description: '微信ID', required: false })
  @Column({ name: 'wechat_id', length: 100, nullable: true, comment: '微信ID' })
  wechatId?: string;

  @ApiProperty({ description: 'MAC地址', required: false })
  @Column({ name: 'mac_address', length: 50, nullable: true, comment: 'MAC地址' })
  macAddress?: string;

  @ApiProperty({ description: '是否删除', required: false })
  @Column({ name: 'is_deleted', type: 'tinyint', width: 1, default: 0, comment: '是否删除：0-未删除，1-已删除' })
  isDeleted: number;

  @ApiProperty({ description: '创建人ID', required: false })
  @Column({ name: 'create_by', type: 'bigint', nullable: true, comment: '创建人ID' })
  createBy?: number;

  @ApiProperty({ description: '更新人ID', required: false })
  @Column({ name: 'update_by', type: 'bigint', nullable: true, comment: '更新人ID' })
  updateBy?: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'update_time', comment: '更新时间' })
  updateTime: Date;
}
