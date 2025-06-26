-- 新的角色权限系统数据库设计
-- 基于截图要求重新设计

-- 删除旧的相关表（如果存在）
DROP TABLE IF EXISTS t_user_roles;
DROP TABLE IF EXISTS t_role_permissions;  
DROP TABLE IF EXISTS t_permissions;
DROP TABLE IF EXISTS t_roles;
DROP TABLE IF EXISTS t_users;

-- 1. 用户表 - 简化设计
CREATE TABLE t_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密后）',
    nickname VARCHAR(50) COMMENT '昵称',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    gender ENUM('男', '女') COMMENT '性别',
    status ENUM('启用', '禁用') DEFAULT '启用' COMMENT '用户状态',
    avatar VARCHAR(255) COMMENT '头像URL',
    last_login_time DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    create_by BIGINT COMMENT '创建人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT = '用户表';

-- 2. 角色表
CREATE TABLE t_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    description TEXT COMMENT '角色描述',
    status ENUM('启用', '禁用') DEFAULT '启用' COMMENT '角色状态',
    create_by BIGINT COMMENT '创建人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT = '角色表';

-- 3. 权限表 - 分菜单权限和按钮权限
CREATE TABLE t_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
    permission_type ENUM('menu', 'button') NOT NULL COMMENT '权限类型：menu-菜单权限，button-按钮权限',
    parent_id BIGINT DEFAULT 0 COMMENT '父级权限ID，0表示顶级',
    path VARCHAR(255) COMMENT '菜单路径',
    component VARCHAR(255) COMMENT '组件路径',
    icon VARCHAR(100) COMMENT '图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status ENUM('启用', '禁用') DEFAULT '启用' COMMENT '权限状态',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT = '权限表';

-- 4. 用户角色关联表 - 多对多
CREATE TABLE t_user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES t_users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES t_roles(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_role (user_id, role_id)
) COMMENT = '用户角色关联表';

-- 5. 角色权限关联表 - 多对多
CREATE TABLE t_role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (role_id) REFERENCES t_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES t_permissions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_permission (role_id, permission_id)
) COMMENT = '角色权限关联表';

-- 创建索引
CREATE INDEX idx_users_username ON t_users(username);
CREATE INDEX idx_users_phone ON t_users(phone);
CREATE INDEX idx_users_email ON t_users(email);
CREATE INDEX idx_users_status ON t_users(status);
CREATE INDEX idx_roles_code ON t_roles(role_code);
CREATE INDEX idx_roles_status ON t_roles(status);
CREATE INDEX idx_permissions_code ON t_permissions(permission_code);
CREATE INDEX idx_permissions_type ON t_permissions(permission_type);
CREATE INDEX idx_permissions_parent ON t_permissions(parent_id);

-- 插入初始菜单权限数据
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, path, component, icon, sort_order) VALUES
-- 顶级菜单
('首页', 'page.home', 'menu', 0, '/home', 'Home', 'IconHome', 1),
('功能', 'page.function', 'menu', 0, '/function', 'Function', 'IconApps', 2),
('异常页', 'page.exception', 'menu', 0, '/exception', 'Exception', 'IconExclamation', 3),
('多级菜单', 'page.multilevel', 'menu', 0, '/multilevel', 'MultiLevel', 'IconMenuFold', 4),
('系统管理', 'page.system', 'menu', 0, '/system', 'System', 'IconSettings', 5);

-- 二级菜单 - 多级菜单下
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, path, component, sort_order) VALUES
((SELECT id FROM t_permissions WHERE permission_code = 'page.multilevel'), '一级子菜单1', 'page.multilevel.level1_1', 'menu', '/multilevel/level1-1', 'Level1_1', 6),
((SELECT id FROM t_permissions WHERE permission_code = 'page.multilevel'), '一级子菜单2', 'page.multilevel.level1_2', 'menu', '/multilevel/level1-2', 'Level1_2', 7);

-- 系统管理下的子菜单
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, path, component, sort_order) VALUES
((SELECT id FROM t_permissions WHERE permission_code = 'page.system'), '用户管理', 'page.system.users', 'menu', '/system/users', 'UserManage', 8),
((SELECT id FROM t_permissions WHERE permission_code = 'page.system'), '角色管理', 'page.system.roles', 'menu', '/system/roles', 'RoleManage', 9),
((SELECT id FROM t_permissions WHERE permission_code = 'page.system'), '菜单管理', 'page.system.menus', 'menu', '/system/menus', 'MenuManage', 10),
((SELECT id FROM t_permissions WHERE permission_code = 'page.system'), '用户详情', 'page.system.user_detail', 'menu', '/system/user-detail', 'UserDetail', 11);

-- 插入按钮权限数据
INSERT INTO t_permissions (permission_name, permission_code, permission_type, sort_order) VALUES
('按钮权限1', 'button1', 'button', 101),
('按钮权限2', 'button2', 'button', 102),
('按钮权限3', 'button3', 'button', 103),
('按钮权限4', 'button4', 'button', 104),
('按钮权限5', 'button5', 'button', 105),
('按钮权限6', 'button6', 'button', 106),
('按钮权限7', 'button7', 'button', 107),
('按钮权限8', 'button8', 'button', 108),
('按钮权限9', 'button9', 'button', 109),
('按钮权限10', 'button10', 'button', 110);

-- 插入初始角色数据
INSERT INTO t_roles (role_name, role_code, description, create_by) VALUES
('超级管理员', 'admin', '系统超级管理员，拥有所有权限', 1),
('普通用户', 'user', '普通用户，拥有基础权限', 1),
('测试角色', 'test', '测试角色，用于测试权限功能', 1);

-- 插入初始用户数据
INSERT INTO t_users (username, password, nickname, phone, email, gender, create_by) VALUES
('admin', '$2a$10$7JB720yubVSVG8QD.yzQhe/nfO.iT4CZyoWp3SrBqK4jf.VQHCYAu', '系统管理员', '13800138000', 'admin@example.com', '男', 1),
('user001', '$2a$10$7JB720yubVSVG8QD.yzQhe/nfO.iT4CZyoWp3SrBqK4jf.VQHCYAu', '张三', '13800138001', 'user001@example.com', '男', 1),
('user002', '$2a$10$7JB720yubVSVG8QD.yzQhe/nfO.iT4CZyoWp3SrBqK4jf.VQHCYAu', '李四', '13800138002', 'user002@example.com', '女', 1);

-- 分配用户角色
INSERT INTO t_user_roles (user_id, role_id) VALUES
(1, 1), -- admin 用户分配超级管理员角色
(2, 2), -- user001 分配普通用户角色
(3, 2); -- user002 分配普通用户角色

-- 分配角色权限 - 超级管理员拥有所有权限
INSERT INTO t_role_permissions (role_id, permission_id) 
SELECT 1, id FROM t_permissions;

-- 分配角色权限 - 普通用户拥有部分权限
INSERT INTO t_role_permissions (role_id, permission_id) 
SELECT 2, id FROM t_permissions 
WHERE permission_code IN ('page.home', 'page.function', 'button1', 'button2', 'button3'); 