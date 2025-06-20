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
    area VARCHAR(50) COMMENT '所属区域',
    customer_type VARCHAR(20) COMMENT '客户类型',
    enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用：1-启用，0-禁用',
    update_by VARCHAR(50) COMMENT '更新人',
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
INSERT INTO t_customer (customer_code, customer_name, contact_person, phone, address, longitude, latitude, province, city, district, area, customer_type, enabled, update_by) VALUES 
('C001', '北京华领科技有限公司', '陈经理', '010-88888888', '北京市朝阳区建国门外大街123号', 116.407526, 39.904200, '北京市', '北京市', '朝阳区', '华北', '企业客户', 1, '系统'),
('C002', '上海创新物流集团', '刘总监', '021-66666666', '上海市浦东新区陆家嘴金融贸易区456号', 121.473701, 31.230416, '上海市', '上海市', '浦东新区', '华东', '物流客户', 1, '系统'),
('C003', '深圳智慧供应链公司', '吴厂长', '0755-55555555', '深圳市南山区科技园南区深南大道789号', 113.942890, 22.540503, '广东省', '深圳市', '南山区', '华南', '供应链客户', 1, '系统'),
('232', '宝鸡保税区科技公司', '李经理', '0917-8888888', '宝鸡市高新区高新大道123号', 107.132427, 34.361979, '陕西省', '宝鸡市', '高新区', '宝鸡保税', '企业客户', 1, '系统'),
('254', '西安物流中心', '王总', '029-88888888', '西安市雁塔区科技路456号', 108.940175, 34.341568, '陕西省', '西安市', '雁塔区', '西安', '物流客户', 1, '系统'),
('46', '福建保税物流园', '陈主管', '0591-66666666', '福州市马尾区快安科技园789号', 119.432591, 26.012259, '福建省', '福州市', '马尾区', '福建保税', '园区客户', 1, '系统'),
('577', '西安高新技术企业', '张董事', '029-99999999', '西安市高新区唐延路321号', 108.907841, 34.236034, '陕西省', '西安市', '高新区', '西安', '高新企业', 1, '系统'); 