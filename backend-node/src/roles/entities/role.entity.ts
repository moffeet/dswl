import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity('t_roles')
export class Role {
  @PrimaryGeneratedColumn({ comment: '角色ID' })
  id: number;

  @Column({ name: 'role_name', length: 50, comment: '角色名称' })
  roleName: string;

  @Column({ name: 'role_code', length: 50, unique: true, comment: '角色编码' })
  roleCode: string;

  @Column({ type: 'text', nullable: true, comment: '角色描述' })
  description?: string;

  @Column({ type: 'varchar', length: 10, default: '启用', comment: '角色状态' })
  status: string;

  @Column({ name: 'mini_app_login_enabled', type: 'boolean', default: false, comment: '是否允许小程序登录' })
  miniAppLoginEnabled: boolean;

  @Column({ name: 'create_by', type: 'bigint', nullable: true, comment: '创建人ID' })
  createBy?: number;

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', comment: '更新时间' })
  updateTime: Date;

  // 多对多关系：角色-用户 (暂时注释，避免循环引用)
  // @ManyToMany(() => User, user => user.roles)
  // users: User[];

  // 多对多关系：角色-权限
  @ManyToMany(() => Permission)
  @JoinTable({
    name: 't_role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' }
  })
  permissions: Permission[];
} 