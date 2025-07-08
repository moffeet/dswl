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



  @Column({ name: 'is_deleted', type: 'tinyint', width: 1, default: 0, comment: '是否删除：0-未删除，1-已删除' })
  isDeleted: number;

  @Column({ name: 'create_by', type: 'bigint', nullable: true, comment: '创建人ID' })
  createBy?: number;

  @Column({ name: 'update_by', type: 'bigint', nullable: true, comment: '更新人ID' })
  updateBy?: number;

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