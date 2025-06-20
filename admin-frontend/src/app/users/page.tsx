'use client';

import React, { useState, useEffect } from 'react';
import { Button, Table, Space, Modal, Form, Input, Select, Message, Popconfirm, Badge, Card, Statistic, Tag, Tooltip } from '@arco-design/web-react';
import { Grid } from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconSearch, IconRefresh, IconUser, IconUserGroup, IconSettings, IconPhone, IconEmail, IconEye } from '@arco-design/web-react/icon';

const { Row, Col } = Grid;
const { Option } = Select;

// 类型定义
interface User {
  id: number;
  username: string;
  realName: string;
  phone: string;
  email: string;
  gender: 'male' | 'female';
  nickname: string;
  userType: 'admin' | 'driver' | 'sales';
  status: 'active' | 'inactive' | 'suspended';
  avatar: string | null;
  driverCode: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string;
  updateBy?: string;
}

// 模拟数据
const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin001',
    realName: '张三',
    phone: '15113554918',
    email: 'admin@wlxt.com',
    gender: 'male',
    nickname: '超级管理员',
    userType: 'admin',
    status: 'active',
    avatar: null,
    driverCode: null,
    lastLoginAt: '2024-06-20 10:30:00',
    createdAt: '2023-12-01 09:00:00',
    updatedAt: '2024-06-20 10:30:00',
    updateBy: '系统',
  },
  {
    id: 2,
    username: 'driver001',
    realName: '李师傅',
    phone: '15726671239',
    email: 'driver001@wlxt.com',
    gender: 'male',
    nickname: '配送一队队长',
    userType: 'driver',
    status: 'active',
    avatar: null,
    driverCode: 'D001',
    lastLoginAt: '2024-06-20 14:20:00',
    createdAt: '2023-12-02 10:15:00',
    updatedAt: '2024-06-20 14:20:00',
    updateBy: '管理员',
  },
  {
    id: 3,
    username: 'sales001',
    realName: '王小丽',
    phone: '15515414176',
    email: 'sales001@wlxt.com',
    gender: 'female',
    nickname: '华北区销售经理',
    userType: 'sales',
    status: 'active',
    avatar: null,
    driverCode: null,
    lastLoginAt: '2024-06-20 16:45:00',
    createdAt: '2023-12-03 11:30:00',
    updatedAt: '2024-06-20 16:45:00',
    updateBy: '管理员',
  },
  {
    id: 4,
    username: 'driver002',
    realName: '赵师傅',
    phone: '13800138000',
    email: 'driver002@wlxt.com',
    gender: 'male',
    nickname: '配送二队',
    userType: 'driver',
    status: 'suspended',
    avatar: null,
    driverCode: 'D002',
    lastLoginAt: '2024-06-19 08:15:00',
    createdAt: '2023-12-05 14:20:00',
    updatedAt: '2024-06-19 18:30:00',
    updateBy: '管理员',
  },
];

// 用户类型标签颜色
const getUserTypeTagColor = (userType: string) => {
  const colorMap: Record<string, string> = {
    admin: 'red',
    driver: 'blue', 
    sales: 'green',
  };
  return colorMap[userType] || 'gray';
};

// 状态标签颜色
const getStatusTagColor = (status: string) => {
  const colorMap: Record<string, string> = {
    active: 'green',
    inactive: 'gray',
    suspended: 'orange',
  };
  return colorMap[status] || 'gray';
};

export default function UsersPage() {
  const [data, setData] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [searchValues, setSearchValues] = useState({
    username: '',
    realName: '',
    userType: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: mockUsers.length,
  });

  // 统计数据
  const stats = {
    total: data.length,
    admin: data.filter(u => u.userType === 'admin').length,
    driver: data.filter(u => u.userType === 'driver').length,
    sales: data.filter(u => u.userType === 'sales').length,
  };

  // 格式化时间
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 搜索
  const handleSearch = () => {
    setLoading(true);
    // 模拟搜索逻辑
    setTimeout(() => {
      let filteredData = mockUsers;
      
      if (searchValues.username) {
        filteredData = filteredData.filter(user => 
          user.username.toLowerCase().includes(searchValues.username.toLowerCase()) ||
          user.realName.includes(searchValues.username)
        );
      }
      
      if (searchValues.realName) {
        filteredData = filteredData.filter(user => 
          user.realName.includes(searchValues.realName)
        );
      }
      
      if (searchValues.userType) {
        filteredData = filteredData.filter(user => user.userType === searchValues.userType);
      }
      
      setData(filteredData);
      setPagination(prev => ({ ...prev, total: filteredData.length, current: 1 }));
      setLoading(false);
    }, 500);
  };

  // 重置搜索
  const handleReset = () => {
    const resetValues = { username: '', realName: '', userType: '' };
    setSearchValues(resetValues);
    setData(mockUsers);
    setPagination(prev => ({ ...prev, current: 1, total: mockUsers.length }));
  };

  // 查看详情
  const handleView = (record: User) => {
    setEditingRecord(record);
    setViewModalVisible(true);
  };

  // 编辑用户
  const handleEdit = (record: User) => {
    setEditingRecord(record);
    form.setFieldsValue({
      username: record.username,
      realName: record.realName,
      phone: record.phone,
      email: record.email,
      gender: record.gender,
      nickname: record.nickname,
      userType: record.userType,
      status: record.status,
    });
    setModalVisible(true);
  };

  // 新增用户
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 保存用户
  const handleSave = async () => {
    try {
      const values = await form.validate();
      setLoading(true);

      // 模拟保存操作
      setTimeout(() => {
        if (editingRecord) {
          // 更新用户
          const updatedData = data.map(user => 
            user.id === editingRecord.id 
              ? { ...user, ...values, updatedAt: new Date().toISOString(), updateBy: '管理员' }
              : user
          );
          setData(updatedData);
          Message.success('用户更新成功');
        } else {
          // 新增用户
          const newUser: User = {
            id: Date.now(),
            ...values,
            avatar: null,
            driverCode: values.userType === 'driver' ? `D${String(Date.now()).slice(-3)}` : null,
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updateBy: '管理员',
          };
          setData([newUser, ...data]);
          Message.success('用户创建成功');
        }
        setModalVisible(false);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 删除用户
  const handleDelete = (record: User) => {
    const newData = data.filter(user => user.id !== record.id);
    setData(newData);
    setPagination(prev => ({ ...prev, total: newData.length }));
    Message.success('用户删除成功');
  };

  // 分页变化
  const handleTableChange = (pagination: any) => {
    setPagination(prev => ({ ...prev, ...pagination }));
  };

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      fixed: 'left' as const,
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: '#165DFF', fontSize: 16, lineHeight: 1.4 }}>{text}</span>
      ),
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 280,
      render: (_: any, record: User) => (
        <div style={{ lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#1D2129' }}>
            {record.realName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13, color: '#86909C' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 'fit-content' }}>
              <IconPhone style={{ fontSize: 13 }} />
              {record.phone}
            </span>
            {record.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 'fit-content' }}>
                <IconEmail style={{ fontSize: 13 }} />
                {record.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '角色类型',
      key: 'userType',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: User) => (
        <div style={{ textAlign: 'center' }}>
          <Tag 
            color={getUserTypeTagColor(record.userType)} 
            style={{ 
              borderRadius: 6, 
              fontSize: 13,
              fontWeight: 500,
              padding: '4px 10px',
              lineHeight: 1.2,
              marginBottom: 4
            }}
          >
            {{ admin: '管理员', driver: '司机', sales: '销售' }[record.userType]}
          </Tag>
          {record.driverCode && (
            <div style={{ fontSize: 12, color: '#86909C', marginTop: 4 }}>
              编号: {record.driverCode}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '用户状态',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: User) => (
        <Tag 
          color={getStatusTagColor(record.status)} 
          style={{ 
            borderRadius: 6, 
            fontSize: 13,
            fontWeight: 500,
            padding: '4px 10px',
            lineHeight: 1.2
          }}
        >
          {{ active: '正常', inactive: '禁用', suspended: '暂停' }[record.status]}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      key: 'lastLoginAt',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: User) => (
        <div style={{ fontSize: 13, textAlign: 'center', color: '#1D2129' }}>
          {record.lastLoginAt ? formatDateTime(record.lastLoginAt) : '从未登录'}
        </div>
      ),
    },
    {
      title: '更新时间',
      key: 'updatedAt',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: User) => (
        <div style={{ fontSize: 13, textAlign: 'center', color: '#1D2129', fontWeight: 500 }}>
          {formatDateTime(record.updatedAt || record.createdAt)}
        </div>
      ),
    },
    {
      title: '更新人',
      key: 'updateBy',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: User) => (
        <div style={{ fontSize: 13, textAlign: 'center', color: '#86909C' }}>
          {record.updateBy || '系统'}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: User) => (
        <Space size={6}>
          <Tooltip content="查看详情">
            <Button
              type="primary"
              size="small"
              icon={<IconEye style={{ fontSize: 13 }} />}
              onClick={() => handleView(record)}
              style={{ 
                height: 26,
                minWidth: 26,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
              }}
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="primary"
              size="small"
              icon={<IconEdit style={{ fontSize: 13 }} />}
              onClick={() => handleEdit(record)}
              style={{ 
                height: 26,
                minWidth: 26,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(245, 87, 108, 0.3)'
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ 
      padding: '16px',
      background: '#F7F8FA',
      minHeight: '100vh'
    }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card style={{ 
            borderRadius: 12,
            border: '1px solid #E5E6EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#86909C', marginBottom: 8 }}>总用户数</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <IconUser style={{ color: '#165DFF', fontSize: 20 }} />
                <span style={{ color: '#1D2129', fontSize: 24, fontWeight: 600 }}>{stats.total}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderRadius: 12,
            border: '1px solid #E5E6EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#86909C', marginBottom: 8 }}>管理员</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <IconSettings style={{ color: '#F53F3F', fontSize: 20 }} />
                <span style={{ color: '#F53F3F', fontSize: 24, fontWeight: 600 }}>{stats.admin}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderRadius: 12,
            border: '1px solid #E5E6EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#86909C', marginBottom: 8 }}>司机</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <IconUserGroup style={{ color: '#165DFF', fontSize: 20 }} />
                <span style={{ color: '#165DFF', fontSize: 24, fontWeight: 600 }}>{stats.driver}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderRadius: 12,
            border: '1px solid #E5E6EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#86909C', marginBottom: 8 }}>销售</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <IconUserGroup style={{ color: '#00B42A', fontSize: 20 }} />
                <span style={{ color: '#00B42A', fontSize: 24, fontWeight: 600 }}>{stats.sales}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <Card 
        style={{ 
          marginBottom: 16,
          borderRadius: 12,
          border: '1px solid #E5E6EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ padding: '20px' }}>
          <Row gutter={[16, 12]} align="center">
            <Col span={5}>
              <div>
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 500, 
                  color: '#4E5969',
                  marginBottom: 6,
                  display: 'block'
                }}>
                  用户名/姓名
                </span>
                <Input 
                  placeholder="请输入用户名或姓名" 
                  value={searchValues.username}
                  onChange={(value) => setSearchValues(prev => ({ ...prev, username: value }))}
                  style={{ 
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid #E5E6EB',
                    fontSize: 14
                  }}
                  prefix={<IconSearch style={{ color: '#86909C', fontSize: 14 }} />}
                />
              </div>
            </Col>
            <Col span={5}>
              <div>
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 500, 
                  color: '#4E5969',
                  marginBottom: 6,
                  display: 'block'
                }}>
                  真实姓名
                </span>
                <Input 
                  placeholder="请输入真实姓名" 
                  value={searchValues.realName}
                  onChange={(value) => setSearchValues(prev => ({ ...prev, realName: value }))}
                  style={{ 
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid #E5E6EB',
                    fontSize: 14
                  }}
                />
              </div>
            </Col>
            <Col span={4}>
              <div>
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 500, 
                  color: '#4E5969',
                  marginBottom: 6,
                  display: 'block'
                }}>
                  用户类型
                </span>
                <Select 
                  placeholder="请选择类型" 
                  value={searchValues.userType || undefined}
                  onChange={(value) => setSearchValues(prev => ({ ...prev, userType: value || '' }))}
                  allowClear
                  style={{ 
                    height: 36,
                    width: '100%'
                  }}
                  dropdownMenuStyle={{
                    borderRadius: 8,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    border: '1px solid #E5E6EB'
                  }}
                >
                  <Select.Option value="admin">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: '#F53F3F' 
                      }}></span>
                      管理员
                    </div>
                  </Select.Option>
                  <Select.Option value="driver">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: '#165DFF' 
                      }}></span>
                      司机
                    </div>
                  </Select.Option>
                  <Select.Option value="sales">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: '#00B42A' 
                      }}></span>
                      销售
                    </div>
                  </Select.Option>
                </Select>
              </div>
            </Col>
            <Col span={10} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 12 }}>
              <Button
                type="primary"
                icon={<IconSearch style={{ fontSize: 14 }} />}
                onClick={handleSearch}
                loading={loading}
                style={{
                  height: 36,
                  padding: '0 20px',
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #3370FF 0%, #4A9EFF 100%)',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 14,
                  boxShadow: '0 2px 6px rgba(51, 112, 255, 0.3)'
                }}
              >
                查询
              </Button>
              <Button
                icon={<IconRefresh style={{ fontSize: 14 }} />}
                onClick={handleReset}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 6,
                  border: '1px solid #E5E6EB',
                  background: '#FFFFFF',
                  color: '#4E5969',
                  fontWeight: 500,
                  fontSize: 14
                }}
              >
                重置
              </Button>
              <Button
                type="primary"
                icon={<IconPlus style={{ fontSize: 14 }} />}
                onClick={handleAdd}
                style={{
                  height: 36,
                  padding: '0 20px',
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #00B42A 0%, #7BC142 100%)',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 14,
                  boxShadow: '0 2px 6px rgba(0, 180, 42, 0.3)'
                }}
              >
                新增用户
              </Button>
            </Col>
          </Row>
        </div>
      </Card>

      {/* 表格区域 */}
      <Card 
        style={{ 
          borderRadius: 12,
          border: '1px solid #E5E6EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}
      >
        <Table
          columns={columns}
          data={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            sizeCanChange: true,
            onChange: handleTableChange,
          }}
          scroll={{ x: 1200 }}
          rowClassName={(record, index) => index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
        />
      </Card>

      {/* 新增/编辑用户弹窗 */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {editingRecord ? '编辑用户' : '新增用户'}
          </div>
        }
        visible={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        style={{ borderRadius: 8, width: 600 }}
      >
        <div style={{ padding: '24px' }}>
          <Form form={form} layout="vertical" size="large">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="用户名"
                  field="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input placeholder="请输入用户名" style={{ borderRadius: 6 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="真实姓名"
                  field="realName"
                  rules={[{ required: true, message: '请输入真实姓名' }]}
                >
                  <Input placeholder="请输入真实姓名" style={{ borderRadius: 6 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="手机号"
                  field="phone"
                  rules={[
                    { required: true, message: '请输入手机号' },
                    { match: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                  ]}
                >
                  <Input placeholder="请输入手机号" style={{ borderRadius: 6 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="邮箱"
                  field="email"
                  rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
                >
                  <Input placeholder="请输入邮箱" style={{ borderRadius: 6 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="性别"
                  field="gender"
                >
                  <Select placeholder="请选择性别" style={{ borderRadius: 6 }}>
                    <Option value="male">男</Option>
                    <Option value="female">女</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="昵称"
                  field="nickname"
                >
                  <Input placeholder="请输入昵称" style={{ borderRadius: 6 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="用户类型"
                  field="userType"
                  rules={[{ required: true, message: '请选择用户类型' }]}
                >
                  <Select placeholder="请选择用户类型" style={{ borderRadius: 6 }}>
                    <Option value="admin">管理员</Option>
                    <Option value="driver">司机</Option>
                    <Option value="sales">销售</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="用户状态"
                  field="status"
                  rules={[{ required: true, message: '请选择用户状态' }]}
                >
                  <Select placeholder="请选择用户状态" style={{ borderRadius: 6 }}>
                    <Option value="active">正常</Option>
                    <Option value="inactive">禁用</Option>
                    <Option value="suspended">暂停</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

      {/* 查看详情模态框 */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            用户详情
          </div>
        }
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setViewModalVisible(false)}
            style={{ borderRadius: 6 }}
          >
            关闭
          </Button>,
        ]}
        style={{ borderRadius: 8 }}
      >
        <div style={{ padding: '24px' }}>
          {editingRecord && (
            <div style={{ lineHeight: 2 }}>
              <p><strong>用户名：</strong>{editingRecord.username}</p>
              <p><strong>真实姓名：</strong>{editingRecord.realName}</p>
              <p><strong>手机号：</strong>{editingRecord.phone}</p>
              <p><strong>邮箱：</strong>{editingRecord.email || '未设置'}</p>
              <p><strong>性别：</strong>{{ male: '男', female: '女' }[editingRecord.gender] || '未设置'}</p>
              <p><strong>昵称：</strong>{editingRecord.nickname || '未设置'}</p>
              <p>
                <strong>用户类型：</strong>
                <Tag 
                  color={getUserTypeTagColor(editingRecord.userType)} 
                  style={{ marginLeft: 8, borderRadius: 4 }}
                >
                  {{ admin: '管理员', driver: '司机', sales: '销售' }[editingRecord.userType]}
                </Tag>
              </p>
              <p>
                <strong>用户状态：</strong>
                <Tag 
                  color={getStatusTagColor(editingRecord.status)} 
                  style={{ marginLeft: 8, borderRadius: 4 }}
                >
                  {{ active: '正常', inactive: '禁用', suspended: '暂停' }[editingRecord.status]}
                </Tag>
              </p>
              {editingRecord.driverCode && (
                <p><strong>司机编号：</strong>{editingRecord.driverCode}</p>
              )}
              <p><strong>最后登录：</strong>{editingRecord.lastLoginAt ? formatDateTime(editingRecord.lastLoginAt) : '从未登录'}</p>
              <p><strong>创建时间：</strong>{formatDateTime(editingRecord.createdAt)}</p>
              <p><strong>更新时间：</strong>{formatDateTime(editingRecord.updatedAt || editingRecord.createdAt)}</p>
              <p><strong>更新人：</strong>{editingRecord.updateBy || '系统'}</p>
            </div>
          )}
        </div>
      </Modal>

      <style jsx global>{`
        .table-row-even {
          background-color: #FAFBFC !important;
        }
        .table-row-odd {
          background-color: #FFFFFF !important;
        }
        .table-row-even:hover,
        .table-row-odd:hover {
          background-color: #F0F8FF !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        .arco-table-thead > tr > th {
          background-color: #F7F8FA !important;
          border-bottom: 2px solid #E5E6EB !important;
          font-weight: 600 !important;
          color: #1D2129 !important;
          padding: 18px 16px !important;
          font-size: 14px !important;
          height: 56px !important;
        }
        .arco-table-tbody > tr > td {
          padding: 20px 16px !important;
          border-bottom: 1px solid #F2F3F5 !important;
          vertical-align: middle !important;
          height: 72px !important;
        }
        .arco-table {
          border-radius: 0 !important;
        }
        .arco-pagination {
          padding: 16px 24px !important;
          background-color: #FAFBFC !important;
          border-top: 1px solid #E5E6EB !important;
        }
        
        /* 美化下拉框样式 */
        .arco-select-view {
          border-radius: 6px !important;
          border: 1px solid #E5E6EB !important;
          transition: all 0.2s ease !important;
        }
        .arco-select-view:hover {
          border-color: #4A9EFF !important;
        }
        .arco-select-focused .arco-select-view {
          border-color: #3370FF !important;
          box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.1) !important;
        }
        .arco-select-option {
          padding: 8px 12px !important;
          border-radius: 4px !important;
          margin: 2px 4px !important;
          transition: all 0.2s ease !important;
        }
        .arco-select-option:hover {
          background-color: #F0F8FF !important;
        }
        .arco-select-option-selected {
          background-color: #E8F4FF !important;
          color: #3370FF !important;
          font-weight: 500 !important;
        }
        .arco-select-dropdown {
          border-radius: 8px !important;
          border: 1px solid #E5E6EB !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
          padding: 4px !important;
        }
        
        /* 优化输入框样式 */
        .arco-input {
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
        }
        .arco-input:hover {
          border-color: #4A9EFF !important;
        }
        .arco-input-focus {
          border-color: #3370FF !important;
          box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.1) !important;
        }
        
        /* 优化操作按钮样式 */
        .arco-btn-primary {
          transition: all 0.2s ease !important;
        }
        .arco-btn-primary:hover {
          transform: translateY(-1px) scale(1.05) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          filter: brightness(1.1) !important;
        }
        .arco-btn-primary:active {
          transform: translateY(0) scale(1) !important;
          transition: all 0.1s ease !important;
        }
      `}</style>
    </div>
  );
} 