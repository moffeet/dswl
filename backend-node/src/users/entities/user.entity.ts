import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserType {
  ADMIN = 'admin',
  DRIVER = 'driver',
  SALES = 'sales',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('users')
export class User {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户名' })
  @Column({ length: 50, unique: true })
  username: string;

  @ApiProperty({ description: '密码' })
  @Column({ length: 255 })
  password: string;

  @ApiProperty({ description: '真实姓名' })
  @Column({ length: 50 })
  realName: string;

  @ApiProperty({ description: '手机号' })
  @Column({ length: 20, unique: true })
  phone: string;

  @ApiProperty({ description: '邮箱', required: false })
  @Column({ length: 100, nullable: true, unique: true })
  email: string;

  @ApiProperty({ description: '性别', enum: Gender, required: false })
  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @ApiProperty({ description: '昵称', required: false })
  @Column({ length: 50, nullable: true })
  nickname: string;

  @ApiProperty({ description: '微信OpenID', required: false })
  @Column({ length: 100, nullable: true })
  wechatOpenid: string;

  @ApiProperty({ description: '用户类型', enum: UserType })
  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.DRIVER,
  })
  userType: UserType;

  @ApiProperty({ description: '用户状态', enum: UserStatus })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({ description: '头像URL', required: false })
  @Column({ length: 255, nullable: true })
  avatar: string;

  @ApiProperty({ description: '司机编号', required: false })
  @Column({ length: 20, nullable: true, unique: true })
  driverCode: string;

  @ApiProperty({ description: '最后登录时间', required: false })
  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
} 