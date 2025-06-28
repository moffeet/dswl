-- 物流配送管理系统数据库初始化脚本
-- 开发环境：直接删除重建数据库

DROP DATABASE IF EXISTS logistics_db;
CREATE DATABASE logistics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE logistics_db;

-- 1. 用户表
CREATE TABLE t_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    nickname VARCHAR(100) COMMENT '昵称',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    gender ENUM('male', 'female') DEFAULT 'male' COMMENT '性别',
    status ENUM('normal', 'disabled') DEFAULT 'normal' COMMENT '用户状态',
    avatar VARCHAR(255) COMMENT '头像URL',
    last_login_time DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    current_login_ip VARCHAR(50) COMMENT '当前登录IP',
    current_token VARCHAR(500) COMMENT '当前登录token',
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
    status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '角色状态',
    mini_app_login_enabled BOOLEAN DEFAULT FALSE COMMENT '是否允许小程序登录',
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
    status ENUM('normal', 'disabled') DEFAULT 'normal' COMMENT '权限状态',
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

-- 6. 客户表
CREATE TABLE t_customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customerNumber VARCHAR(50) NOT NULL UNIQUE,
    customerName VARCHAR(100) NOT NULL,
    customerAddress VARCHAR(255) DEFAULT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updateBy VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

-- 插入菜单权限数据
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, path, component, icon, sort_order) VALUES
-- 一级菜单
('首页', 'menu.dashboard', 'menu', 0, '/dashboard', 'Dashboard', 'IconHome', 1),
('系统管理', 'menu.system', 'menu', 0, '/system', NULL, 'IconSettings', 2),
('业务管理', 'menu.business', 'menu', 0, '/business', NULL, 'IconApps', 3);

-- 系统管理下的二级菜单  
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, path, component, icon, sort_order) VALUES
('用户管理', 'menu.system.users', 'menu', 2, '/users', 'UserManage', 'IconUser', 4),
('角色管理', 'menu.system.roles', 'menu', 2, '/roles', 'RoleManage', 'IconUserGroup', 5),
('权限管理', 'menu.system.permissions', 'menu', 2, '/menus', 'PermissionManage', 'IconLock', 6);

-- 业务管理下的二级菜单
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, path, component, icon, sort_order) VALUES
('客户管理', 'menu.business.customers', 'menu', 3, '/customers', 'CustomerManage', 'IconUser', 7);

-- 按钮权限数据（树形结构）
-- 按钮权限作为对应菜单权限的子权限
-- 获取菜单权限的ID
SET @menu_users_id = (SELECT id FROM t_permissions WHERE permission_code = 'menu.system.users');
SET @menu_roles_id = (SELECT id FROM t_permissions WHERE permission_code = 'menu.system.roles');
SET @menu_customers_id = (SELECT id FROM t_permissions WHERE permission_code = 'menu.business.customers');

-- 用户管理相关按钮权限（作为用户管理菜单的子权限）
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, sort_order) VALUES
('用户新增', 'btn.user.add', 'button', @menu_users_id, 101),
('用户编辑', 'btn.user.edit', 'button', @menu_users_id, 102),
('用户删除', 'btn.user.delete', 'button', @menu_users_id, 103),
('用户查看', 'btn.user.view', 'button', @menu_users_id, 104),
('用户导出', 'btn.user.export', 'button', @menu_users_id, 105);

-- 角色管理相关按钮权限（作为角色管理菜单的子权限）
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, sort_order) VALUES
('角色新增', 'btn.role.add', 'button', @menu_roles_id, 201),
('角色编辑', 'btn.role.edit', 'button', @menu_roles_id, 202),
('角色删除', 'btn.role.delete', 'button', @menu_roles_id, 203),
('角色查看', 'btn.role.view', 'button', @menu_roles_id, 204),
('角色分配权限', 'btn.role.assign_permission', 'button', @menu_roles_id, 205);

-- 客户管理相关按钮权限（作为客户管理菜单的子权限）
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, sort_order) VALUES
('客户新增', 'btn.customer.add', 'button', @menu_customers_id, 301),
('客户编辑', 'btn.customer.edit', 'button', @menu_customers_id, 302),
('客户删除', 'btn.customer.delete', 'button', @menu_customers_id, 303),
('客户查看', 'btn.customer.view', 'button', @menu_customers_id, 304),
('客户导出', 'btn.customer.export', 'button', @menu_customers_id, 305);

-- 插入角色数据（包含小程序登录权限）
INSERT INTO t_roles (role_name, role_code, description, mini_app_login_enabled, create_by) VALUES
('超级管理员', 'admin', '系统超级管理员，拥有所有权限', FALSE, 1),
('管理员', 'manager', '管理员，拥有系统管理和部分业务权限', FALSE, 1),
('司机', 'driver', '司机角色，主要负责配送业务', TRUE, 1),
('销售', 'sales', '销售角色，主要负责客户和订单管理', TRUE, 1),
('客服', 'service', '客服角色，主要负责客户服务', TRUE, 1);

-- 插入用户数据（密码均为：123456）
INSERT INTO t_users (username, password, nickname, phone, email, gender, create_by) VALUES
('admin', '$2b$10$KC0763ClzRKOCCAC17mIQOHZR/kDEgTyq8lPorEzrfxyIV2mDykSC', '系统管理员', '13800138000', 'admin@logistics.com', 'male', 1),
('manager001', '$2b$10$KC0763ClzRKOCCAC17mIQOHZR/kDEgTyq8lPorEzrfxyIV2mDykSC', '张经理', '13800138001', 'manager@logistics.com', 'male', 1),
('driver001', '$2b$10$KC0763ClzRKOCCAC17mIQOHZR/kDEgTyq8lPorEzrfxyIV2mDykSC', '李师傅', '13800138002', 'driver001@logistics.com', 'male', 1),
('sales001', '$2b$10$KC0763ClzRKOCCAC17mIQOHZR/kDEgTyq8lPorEzrfxyIV2mDykSC', '王销售', '13800138003', 'sales001@logistics.com', 'female', 1);

-- 分配用户角色
INSERT INTO t_user_roles (user_id, role_id) VALUES
(1, 1), -- admin 分配超级管理员角色
(2, 2), -- manager001 分配管理员角色
(3, 3), -- driver001 分配司机角色
(4, 4); -- sales001 分配销售角色

-- 分配角色权限

-- 1. 超级管理员拥有所有权限
INSERT INTO t_role_permissions (role_id, permission_id) 
SELECT 1, id FROM t_permissions;

-- 2. 管理员角色权限（系统管理 + 部分业务管理）
INSERT INTO t_role_permissions (role_id, permission_id) 
SELECT 2, id FROM t_permissions 
WHERE permission_code IN (
    -- 菜单权限
    'menu.dashboard', 'menu.system', 'menu.system.users', 'menu.system.roles', 'menu.system.permissions',
    -- 按钮权限
    'btn.user.add', 'btn.user.edit', 'btn.user.delete', 'btn.user.view', 'btn.user.export',
    'btn.role.add', 'btn.role.edit', 'btn.role.delete', 'btn.role.view', 'btn.role.assign_permission'
);

-- 3. 司机角色权限（主要是查看类权限）
INSERT INTO t_role_permissions (role_id, permission_id) 
SELECT 3, id FROM t_permissions 
WHERE permission_code IN (
    -- 菜单权限
    'menu.dashboard', 'menu.business', 'menu.business.customers',
    -- 按钮权限
    'btn.customer.view'
);

-- 4. 销售角色权限（客户和订单管理）
INSERT INTO t_role_permissions (role_id, permission_id) 
SELECT 4, id FROM t_permissions 
WHERE permission_code IN (
    -- 菜单权限
    'menu.dashboard', 'menu.business', 'menu.business.customers',
    -- 按钮权限
    'btn.customer.add', 'btn.customer.edit', 'btn.customer.view', 'btn.customer.export'
);

-- 插入客户测试数据
INSERT INTO t_customers (customerNumber, customerName, customerAddress, updateBy) VALUES
('C001', '深圳科技有限公司', '深圳市南山区科技园南区', '系统'),
('C002', '广州贸易公司', '广州市天河区珠江新城', '管理员'),
('C003', '东莞制造企业', '东莞市长安镇工业区', '管理员'),
('C004', '佛山物流中心', '佛山市禅城区物流园', '系统'),
('C005', '惠州电子厂', '惠州市惠城区工业园', '管理员');

-- ========================================
-- 🎉 数据库初始化完成！
-- ========================================

-- 验证用户表结构
SELECT '✅ 用户表结构验证' AS message;
DESCRIBE t_users;

-- 验证admin用户
SELECT '✅ Admin用户验证' AS message;
SELECT 
    id,
    username,
    nickname,
    status,
    phone,
    email,
    create_time
FROM t_users 
WHERE username = 'admin';

-- 显示初始化完成信息
SELECT '🚀 物流配送管理系统 - 数据库初始化完成！' AS message;
SELECT '📋 登录信息：' AS info;
SELECT '   👤 用户名: admin' AS username;
SELECT '   🔑 密码: 123456' AS password;
SELECT '   🌐 前端地址: http://localhost:3001' AS frontend_url;
SELECT '   🔗 后端地址: http://localhost:3000' AS backend_url;
SELECT '✨ 系统已集成安全增强功能：' AS features;
SELECT '   • Token黑名单机制' AS feature1;
SELECT '   • IP登录冲突检测' AS feature2; 
SELECT '   • 强制登录功能' AS feature3;
SELECT '   • 自动Token过期处理' AS feature4; 