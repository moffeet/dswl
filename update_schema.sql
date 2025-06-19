-- 更新客户表结构以匹配前端字段

USE delivery_system;

-- 添加 area 字段（区域）
ALTER TABLE t_customer ADD COLUMN area VARCHAR(50) COMMENT '所属区域：华北、华东、华南等' AFTER district;

-- 更新现有测试数据，添加区域信息
UPDATE t_customer SET area = '华南' WHERE customer_code IN ('C001', 'C002', 'C003', 'C004', 'C005');

-- 查看更新后的表结构
DESCRIBE t_customer;

-- 查看现有数据
SELECT id, customer_code, customer_name, contact_person, phone, address, area, enabled FROM t_customer; 