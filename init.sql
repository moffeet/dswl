-- 物流配送管理系统数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS delivery_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE delivery_system;

-- 司机表
CREATE TABLE t_driver (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '司机ID',
    name VARCHAR(50) NOT NULL COMMENT '司机姓名',
    phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
    license_number VARCHAR(50) COMMENT '驾驶证号',
    openid VARCHAR(100) UNIQUE COMMENT '微信openid',
    longitude DECIMAL(10,7) COMMENT '当前位置-经度',
    latitude DECIMAL(10,7) COMMENT '当前位置-纬度',
    current_address VARCHAR(200) COMMENT '当前位置地址',
    status VARCHAR(20) DEFAULT 'offline' COMMENT '司机状态：available-可用, busy-忙碌, offline-离线',
    avatar VARCHAR(200) COMMENT '头像地址',
    enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用：1-启用，0-禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT = '司机表';

-- 客户表
CREATE TABLE t_customer (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '客户ID',
    customer_code VARCHAR(50) NOT NULL UNIQUE COMMENT '客户编码',
    customer_name VARCHAR(100) NOT NULL COMMENT '客户名称',
    contact_person VARCHAR(50) COMMENT '联系人',
    phone VARCHAR(20) COMMENT '联系电话',
    address VARCHAR(200) COMMENT '详细地址',
    longitude DECIMAL(10,7) COMMENT '经度',
    latitude DECIMAL(10,7) COMMENT '纬度',
    province VARCHAR(50) COMMENT '省份',
    city VARCHAR(50) COMMENT '城市',
    district VARCHAR(50) COMMENT '区县',
    customer_type VARCHAR(20) COMMENT '客户类型',
    enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用：1-启用，0-禁用',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT = '客户表';

-- 管理员用户表
CREATE TABLE t_admin_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码（加密后）',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    role VARCHAR(20) DEFAULT 'user' COMMENT '角色：admin-超级管理员, user-普通用户',
    avatar VARCHAR(200) COMMENT '头像',
    status INT DEFAULT 1 COMMENT '账号状态：1-启用, 0-禁用',
    last_login_time DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    create_by BIGINT COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT = '管理员用户表';

-- 打卡记录表
CREATE TABLE t_check_in (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '打卡ID',
    driver_id BIGINT NOT NULL COMMENT '司机ID',
    type VARCHAR(20) NOT NULL COMMENT '打卡类型：work_start-上班, work_end-下班, delivery-配送, signature-签收',
    location VARCHAR(200) COMMENT '打卡位置',
    longitude DECIMAL(10,7) COMMENT '经度',
    latitude DECIMAL(10,7) COMMENT '纬度',
    image_path VARCHAR(200) COMMENT '打卡图片路径',
    customer_id BIGINT COMMENT '关联客户ID（配送和签收时）',
    remark TEXT COMMENT '备注',
    check_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '打卡时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (driver_id) REFERENCES t_driver(id),
    FOREIGN KEY (customer_id) REFERENCES t_customer(id)
) COMMENT = '打卡记录表';

-- 创建索引
CREATE INDEX idx_driver_phone ON t_driver(phone);
CREATE INDEX idx_driver_openid ON t_driver(openid);
CREATE INDEX idx_driver_status ON t_driver(status);
CREATE INDEX idx_customer_code ON t_customer(customer_code);
CREATE INDEX idx_customer_name ON t_customer(customer_name);
CREATE INDEX idx_customer_enabled ON t_customer(enabled);
CREATE INDEX idx_admin_username ON t_admin_user(username);
CREATE INDEX idx_checkin_driver ON t_check_in(driver_id);
CREATE INDEX idx_checkin_customer ON t_check_in(customer_id);
CREATE INDEX idx_checkin_time ON t_check_in(check_time);

-- 插入初始数据
-- 插入默认管理员用户（密码：admin123）
INSERT INTO t_admin_user (username, password, real_name, role, status) VALUES 
('admin', '$2a$10$7JB720yubVSVG8QD.yzQhe/nfO.iT4CZyoWp3SrBqK4jf.VQHCYAu', '系统管理员', 'admin', 1);

-- 插入测试司机数据
INSERT INTO t_driver (name, phone, license_number, status, enabled) VALUES 
('张三', '13800000001', 'A12345678901234567', 'available', 1),
('李四', '13800000002', 'B12345678901234567', 'available', 1),
('王五', '13800000003', 'C12345678901234567', 'offline', 1);

-- 插入测试客户数据
INSERT INTO t_customer (customer_code, customer_name, contact_person, phone, address, longitude, latitude, province, city, district, customer_type, enabled) VALUES 
('C001', '广州科技有限公司', '陈经理', '020-88888888', '广州市天河区珠江新城花城大道123号', 113.324520, 23.124049, '广东省', '广州市', '天河区', '企业客户', 1),
('C002', '深圳创新科技', '刘总监', '0755-66666666', '深圳市南山区科技园南区深南大道456号', 113.942890, 22.540503, '广东省', '深圳市', '南山区', '企业客户', 1),
('C003', '东莞制造工厂', '吴厂长', '0769-55555555', '东莞市长安镇振安中路789号', 113.815095, 22.817881, '广东省', '东莞市', '长安镇', '工厂客户', 1),
('C004', '佛山贸易公司', '赵主管', '0757-44444444', '佛山市禅城区季华路321号', 113.106308, 23.021548, '广东省', '佛山市', '禅城区', '贸易客户', 1),
('C005', '中山电子厂', '孙经理', '0760-33333333', '中山市石岐区中山路654号', 113.392782, 22.517745, '广东省', '中山市', '石岐区', '工厂客户', 1); 