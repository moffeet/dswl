import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../roles/entities/role.entity';

@Entity('t_users')
export class User {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn({ comment: '用户ID' })
  id: number;

  @ApiProperty({ description: '用户名' })
  @Column({ length: 50, unique: true, comment: '用户名' })
  username: string;

  @ApiProperty({ description: '密码（加密后）' })
  @Column({ length: 255, comment: '密码（加密后）' })
  password: string;

  @ApiProperty({ description: '昵称', required: false })
  @Column({ length: 50, nullable: true, comment: '昵称' })
  nickname?: string;

  @ApiProperty({ description: '手机号', required: false })
  @Column({ length: 20, nullable: true, comment: '手机号' })
  phone?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @Column({ length: 100, nullable: true, comment: '邮箱' })
  email?: string;

  @ApiProperty({ description: '性别', enum: ['male', 'female'], required: false })
  @Column({ type: 'enum', enum: ['male', 'female'], nullable: true, comment: '性别' })
  gender?: 'male' | 'female';

  @ApiProperty({ description: '用户状态', enum: ['normal', 'disabled'] })
  @Column({ type: 'enum', enum: ['normal', 'disabled'], default: 'normal', comment: '用户状态' })
  status: 'normal' | 'disabled';

  @ApiProperty({ description: '头像URL', required: false })
  @Column({ length: 255, nullable: true, comment: '头像URL' })
  avatar?: string;

  @ApiProperty({ description: '最后登录时间', required: false })
  @Column({ name: 'last_login_time', type: 'datetime', nullable: true, comment: '最后登录时间' })
  lastLoginTime?: Date;

  @ApiProperty({ description: '最后登录IP', required: false })
  @Column({ name: 'last_login_ip', length: 50, nullable: true, comment: '最后登录IP' })
  lastLoginIp?: string;



  @ApiProperty({ description: '创建人ID', required: false })
  @Column({ name: 'create_by', type: 'bigint', nullable: true, comment: '创建人ID' })
  createBy?: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'update_time', comment: '更新时间' })
  updateTime: Date;

  // 多对多关系：用户-角色
  @ManyToMany(() => Role)
  @JoinTable({
    name: 't_user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Role[];
} 