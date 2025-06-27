import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('t_permissions')
export class Permission {
  @PrimaryGeneratedColumn({ comment: '权限ID' })
  id: number;

  @Column({ name: 'permission_name', length: 100, comment: '权限名称' })
  permissionName: string;

  @Column({ name: 'permission_code', length: 100, unique: true, comment: '权限编码' })
  permissionCode: string;

  @Column({ name: 'permission_type', type: 'enum', enum: ['menu', 'button'], comment: '权限类型：menu-菜单权限，button-按钮权限' })
  permissionType: 'menu' | 'button';

  @Column({ name: 'parent_id', type: 'bigint', default: 0, comment: '父级权限ID，0表示顶级' })
  parentId: number;

  @Column({ length: 255, nullable: true, comment: '菜单路径' })
  path?: string;

  @Column({ length: 255, nullable: true, comment: '组件路径' })
  component?: string;

  @Column({ length: 100, nullable: true, comment: '图标' })
  icon?: string;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序' })
  sortOrder: number;

  @Column({ type: 'enum', enum: ['normal', 'disabled'], default: 'normal', comment: '权限状态' })
  status: 'normal' | 'disabled';

  @CreateDateColumn({ name: 'create_time', comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time', comment: '更新时间' })
  updateTime: Date;

  // 多对多关系：权限-角色 (暂时注释，避免循环引用)
  // @ManyToMany(() => Role, role => role.permissions)
  // roles: Role[];
} 