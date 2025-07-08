-- 物流配送管理系统数据库初始化脚本 (MySQL 8.0 兼容版本)
-- 开发环境：直接删除重建数据库

-- 设置 MySQL 8.0 兼容模式
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP DATABASE IF EXISTS logistics_db;
CREATE DATABASE logistics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logistics_db;

-- 1. 用户表
DROP TABLE IF EXISTS t_users;
CREATE TABLE t_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    nickname VARCHAR(100) NOT NULL COMMENT '昵称',
    is_first_login TINYINT(1) DEFAULT 1 COMMENT '是否首次登录：1-是，0-否',
    last_login_time DATETIME NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    current_login_ip VARCHAR(50) COMMENT '当前登录IP',
    current_token VARCHAR(1000) COMMENT '当前登录token',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    create_by BIGINT COMMENT '创建人ID',
    update_by BIGINT COMMENT '更新人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '用户表';

-- 2. 角色表
DROP TABLE IF EXISTS t_roles;
CREATE TABLE t_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    description TEXT COMMENT '角色描述',
    status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '角色状态',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    create_by BIGINT COMMENT '创建人ID',
    update_by BIGINT COMMENT '更新人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '角色表';

-- 3. 权限表 - 分菜单权限和按钮权限
DROP TABLE IF EXISTS t_permissions;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '权限表';

-- 4. 用户角色关联表 - 多对多
DROP TABLE IF EXISTS t_user_roles;
CREATE TABLE t_user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '用户角色关联表';

-- 5. 角色权限关联表 - 多对多
DROP TABLE IF EXISTS t_role_permissions;
CREATE TABLE t_role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT = '角色权限关联表';

-- 6. 客户表
DROP TABLE IF EXISTS t_customers;
CREATE TABLE t_customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customerNumber VARCHAR(50) NOT NULL UNIQUE,
    customerName VARCHAR(100) NOT NULL,
    storeAddress VARCHAR(255) DEFAULT NULL COMMENT '门店地址',
    warehouseAddress VARCHAR(255) DEFAULT NULL COMMENT '仓库地址',
    storeLongitude DECIMAL(10, 7) DEFAULT NULL COMMENT '门店经度',
    storeLatitude DECIMAL(10, 7) DEFAULT NULL COMMENT '门店纬度',
    warehouseLongitude DECIMAL(10, 7) DEFAULT NULL COMMENT '仓库经度',
    warehouseLatitude DECIMAL(10, 7) DEFAULT NULL COMMENT '仓库纬度',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '客户状态',
    lastSyncTime DATETIME DEFAULT NULL COMMENT '最后同步时间',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updateBy VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建索引
CREATE INDEX idx_users_username ON t_users(username);
CREATE INDEX idx_roles_code ON t_roles(role_code);
CREATE INDEX idx_roles_status ON t_roles(status);
CREATE INDEX idx_permissions_code ON t_permissions(permission_code);
CREATE INDEX idx_permissions_type ON t_permissions(permission_type);
CREATE INDEX idx_permissions_parent ON t_permissions(parent_id);
CREATE INDEX idx_users_is_deleted ON t_users(is_deleted);
CREATE INDEX idx_roles_is_deleted ON t_roles(is_deleted);
CREATE INDEX idx_customers_is_deleted ON t_customers(is_deleted);

-- 插入菜单权限数据（扁平结构，与静态权限常量一致）
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, path, component, icon, sort_order) VALUES
('用户管理', 'menu.users', 'menu', 0, '/users', 'UserManage', 'IconUser', 1),
('角色管理', 'menu.roles', 'menu', 0, '/roles', 'RoleManage', 'IconUserGroup', 2),
('客户地址', 'menu.customer', 'menu', 0, '/customer', 'CustomerManage', 'IconLocation', 3),
('签收单', 'menu.receipts', 'menu', 0, '/receipts', 'ReceiptManage', 'IconFileText', 4),
('小程序用户', 'menu.wxuser', 'menu', 0, '/wx-user', 'WxUserManage', 'IconMobile', 5),
('地图', 'menu.map', 'menu', 0, '/map', 'MapView', 'IconMap', 6);

-- 按钮权限数据（与静态权限常量一致）
-- 获取菜单权限的ID
SET @menu_users_id = (SELECT id FROM t_permissions WHERE permission_code = 'menu.users');
SET @menu_roles_id = (SELECT id FROM t_permissions WHERE permission_code = 'menu.roles');
SET @menu_customer_id = (SELECT id FROM t_permissions WHERE permission_code = 'menu.customer');
SET @menu_receipts_id = (SELECT id FROM t_permissions WHERE permission_code = 'menu.receipts');
SET @menu_wxuser_id = (SELECT id FROM t_permissions WHERE permission_code = 'menu.wxuser');

-- 用户管理相关按钮权限
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, sort_order) VALUES
('用户管理-新增', 'btn.users.add', 'button', @menu_users_id, 101),
('用户管理-编辑', 'btn.users.edit', 'button', @menu_users_id, 102),
('用户管理-删除', 'btn.users.delete', 'button', @menu_users_id, 103);

-- 角色管理相关按钮权限
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, sort_order) VALUES
('角色管理-新增', 'btn.roles.add', 'button', @menu_roles_id, 201),
('角色管理-编辑', 'btn.roles.edit', 'button', @menu_roles_id, 202),
('角色管理-删除', 'btn.roles.delete', 'button', @menu_roles_id, 203);

-- 客户地址相关按钮权限
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, sort_order) VALUES
('客户地址-编辑', 'btn.customer.edit', 'button', @menu_customer_id, 301),
('客户地址-导出', 'btn.customer.export', 'button', @menu_customer_id, 302);

-- 签收单相关按钮权限
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, sort_order) VALUES
('签收单-新增', 'btn.receipts.add', 'button', @menu_receipts_id, 401),
('签收单-编辑', 'btn.receipts.edit', 'button', @menu_receipts_id, 402),
('签收单-删除', 'btn.receipts.delete', 'button', @menu_receipts_id, 403);

-- 小程序用户相关按钮权限
INSERT INTO t_permissions (permission_name, permission_code, permission_type, parent_id, sort_order) VALUES
('小程序用户-新增', 'btn.wxuser.add', 'button', @menu_wxuser_id, 501),
('小程序用户-编辑', 'btn.wxuser.edit', 'button', @menu_wxuser_id, 502),
('小程序用户-删除', 'btn.wxuser.delete', 'button', @menu_wxuser_id, 503);

-- 插入角色数据 - 只保留超级管理员角色
INSERT INTO t_roles (role_name, role_code, description, status, create_by) VALUES
('超级管理员', 'admin', '系统超级管理员，拥有所有权限，不可修改', 'enabled', 1);

-- 插入用户数据（只保留超级管理员，密码为admin2025）
INSERT INTO t_users (username, password, nickname, create_by) VALUES
('admin', '$2b$10$aSpzsNf3J/SPHRYg0C/95O9z/RT7aLa81I.q.5V6b/d3OPCLqi7N2', '系统管理员', 1);

-- 分配用户角色
INSERT INTO t_user_roles (user_id, role_id) VALUES
(1, 1); -- admin 分配超级管理员角色

-- 分配角色权限

-- 1. 超级管理员拥有所有权限
INSERT INTO t_role_permissions (role_id, permission_id) 
SELECT 1, id FROM t_permissions;



-- 插入客户测试数据
INSERT INTO t_customers (customerNumber, customerName, storeAddress, warehouseAddress, storeLongitude, storeLatitude, warehouseLongitude, warehouseLatitude, status, updateBy) VALUES
('C001', '深圳科技有限公司', '深圳市南山区科技园南区A座', '深圳市南山区科技园南区B座', 113.9547, 22.5431, 113.9557, 22.5441, 'active', '系统'),
('C002', '广州贸易公司', '广州市天河区珠江新城东塔', '广州市天河区珠江新城西塔', 113.3221, 23.1167, 113.3231, 23.1177, 'active', '管理员'),
('C003', '东莞制造企业', '东莞市长安镇工业区1号', '东莞市长安镇工业区2号', 113.8059, 22.8169, 113.8069, 22.8179, 'active', '管理员'),
('C004', '佛山物流中心', '佛山市禅城区物流园A区', '佛山市禅城区物流园B区', 113.1221, 23.0167, 113.1231, 23.0177, 'active', '系统'),
('C005', '惠州电子厂', '惠州市惠城区工业园东区', '惠州市惠城区工业园西区', 114.4129, 23.0793, 114.4139, 23.0803, 'active', '管理员');

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
    create_time
FROM t_users
WHERE username = 'admin';

-- 添加外键约束
ALTER TABLE t_user_roles ADD CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES t_users(id) ON DELETE CASCADE;
ALTER TABLE t_user_roles ADD CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES t_roles(id) ON DELETE CASCADE;
ALTER TABLE t_role_permissions ADD CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES t_roles(id) ON DELETE CASCADE;
ALTER TABLE t_role_permissions ADD CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES t_permissions(id) ON DELETE CASCADE;

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 显示初始化完成信息
SELECT '🚀 物流配送管理系统 - 数据库初始化完成！' AS message;
SELECT '📋 登录信息：' AS info;
SELECT '   👤 用户名: admin' AS username;
SELECT '   🔑 密码: admin（首次登录需修改密码）' AS password;
SELECT '   🌐 前端地址: http://localhost:3001' AS frontend_url;
SELECT '   🔗 后端地址: http://localhost:3000' AS backend_url;
SELECT '✨ 系统已集成安全增强功能：' AS features;
SELECT '   • Token黑名单机制' AS feature1;
SELECT '   • IP登录冲突检测' AS feature2; 
SELECT '   • 强制登录功能' AS feature3;
SELECT '   • 自动Token过期处理' AS feature4; 