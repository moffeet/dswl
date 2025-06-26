import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('t_roles')
export class Role {
  @PrimaryGeneratedColumn({ comment: '角色ID' })
  id: number;

  @Column({ length: 50, comment: '角色名称' })
  roleName: string;

  @Column({ length: 50, unique: true, comment: '角色编码' })
  roleCode: string;

  @Column({ type: 'text', nullable: true, comment: '角色描述' })
  description?: string;

  @Column({ type: 'enum', enum: ['启用', '禁用'], default: '启用', comment: '角色状态' })
  status: '启用' | '禁用';

  @Column({ type: 'bigint', nullable: true, comment: '创建人ID' })
  createBy?: number;

  @CreateDateColumn({ comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updateTime: Date;

  // 多对多关系：角色-用户 (暂时注释，避免循环引用)
  // @ManyToMany(() => User, user => user.roles)
  // users: User[];

  // 多对多关系：角色-权限 (暂时注释，避免循环引用)
  // @ManyToMany(() => Permission, permission => permission.roles)
  // @JoinTable({
  //   name: 't_role_permissions',
  //   joinColumn: { name: 'role_id', referencedColumnName: 'id' },
  //   inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' }
  // })
  // permissions: Permission[];
} 