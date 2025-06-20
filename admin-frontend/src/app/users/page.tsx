'use client';

import React, { useState, useEffect } from 'react';
import { Button, Table, Space, Modal, Form, Input, Select, Message, Popconfirm, Badge, Card, Statistic, Pagination } from '@arco-design/web-react';
import { Grid } from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconSearch, IconRefresh, IconUser, IconUserGroup, IconSettings } from '@arco-design/web-react/icon';

const { Row, Col } = Grid;

const { Option } = Select;
const { Search } = Input;

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
}

// 模拟数据
const mockUsers = [
  {
    id: 1,
    username: 'vX0Qyp7BnOKT',
    realName: '张三',
    phone: '15113554918',
    email: 'ylhpc@rnmydbc.kw',
    gender: 'male',
    nickname: '小张',
    userType: 'admin',
    status: 'active',
    avatar: null,
    driverCode: null,
    lastLoginAt: '2024-01-20 10:30:00',
    createdAt: '2023-12-01 09:00:00',
  },
  {
    id: 2,
    username: 'K5UjH',
    realName: '李四',
    phone: '15726671239',
    email: 's.enijzre@bqtyv.ac',
    gender: 'male',
    nickname: '小李',
    userType: 'driver',
    status: 'active',
    avatar: null,
    driverCode: 'D001',
    lastLoginAt: '2024-01-19 14:20:00',
    createdAt: '2023-12-02 10:15:00',
  },
  {
    id: 3,
    username: 'ldmb8lynzUG0',
    realName: '王五',
    phone: '15515414176',
    email: 'd.oigh@shhtmnfx.hk',
    gender: 'female',
    nickname: '小王',
    userType: 'sales',
    status: 'active',
    avatar: null,
    driverCode: null,
    lastLoginAt: '2024-01-18 16:45:00',
    createdAt: '2023-12-03 11:30:00',
  },
];

const userTypeMap = {
  admin: { text: '管理员', status: 'success' },
  driver: { text: '司机', status: 'processing' },
  sales: { text: '销售', status: 'warning' },
};

const statusMap = {
  active: { text: '正常', status: 'success' },
  inactive: { text: '禁用', status: 'default' },
  suspended: { text: '暂停', status: 'error' },
};

const genderMap = {
  male: '男',
  female: '女',
};

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchParams, setSearchParams] = useState({
    username: '',
    realName: '',
    phone: '',
    userType: '',
    page: 1,
    pageSize: 10,
  });

  // 统计数据
  const stats = {
    total: users.length,
    admin: users.filter(u => u.userType === 'admin').length,
    driver: users.filter(u => u.userType === 'driver').length,
    sales: users.filter(u => u.userType === 'sales').length,
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'userType',
      key: 'userType',
      width: 100,
      render: (userType: User['userType']) => (
        <Badge status={userTypeMap[userType]?.status} text={userTypeMap[userType]?.text} />
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '用户权限',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: User['status']) => (
        <Badge status={statusMap[status]?.status} text={statusMap[status]?.text} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onOk={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<IconDelete />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(users.filter(u => u.id !== id));
      Message.success('删除成功');
    } catch (error) {
      Message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请选择要删除的用户');
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(users.filter(u => !selectedRowKeys.includes(u.id)));
      setSelectedRowKeys([]);
      Message.success(`成功删除 ${selectedRowKeys.length} 个用户`);
    } catch (error) {
      Message.error('批量删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingUser) {
        // 编辑
        const updatedUsers = users.map(u => 
          u.id === editingUser.id ? { ...u, ...values } : u
        );
        setUsers(updatedUsers);
        Message.success('用户更新成功');
      } else {
        // 新增
        const newUser = {
          id: Date.now(),
          ...values,
          status: 'active',
          createdAt: new Date().toLocaleString(),
          lastLoginAt: null,
        };
        setUsers([newUser, ...users]);
        Message.success('用户创建成功');
      }
      
      setVisible(false);
      form.resetFields();
    } catch (error) {
      Message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // 模拟搜索
    Message.info('搜索功能暂未实现');
  };

  const handleReset = () => {
    setSearchParams({
      username: '',
      realName: '',
      phone: '',
      userType: '',
      page: 1,
      pageSize: 10,
    });
    setUsers(mockUsers);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.total}
              prefix={<IconUser />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="管理员"
              value={stats.admin}
              prefix={<IconSettings />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="司机"
              value={stats.driver}
              prefix={<IconUserGroup />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="销售"
              value={stats.sales}
              prefix={<IconUserGroup />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {/* 搜索区域 */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <Input
              placeholder="用户名"
              value={searchParams.username}
              onChange={(value) => setSearchParams({ ...searchParams, username: value })}
            />
          </Col>
          <Col span={6}>
            <Input
              placeholder="真实姓名"
              value={searchParams.realName}
              onChange={(value) => setSearchParams({ ...searchParams, realName: value })}
            />
          </Col>
          <Col span={6}>
            <Input
              placeholder="手机号"
              value={searchParams.phone}
              onChange={(value) => setSearchParams({ ...searchParams, phone: value })}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="用户类型"
              value={searchParams.userType}
              onChange={(value) => setSearchParams({ ...searchParams, userType: value })}
              allowClear
            >
              <Option value="admin">管理员</Option>
              <Option value="driver">司机</Option>
              <Option value="sales">销售</Option>
            </Select>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <Space style={{ marginBottom: '16px' }}>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
            新建用户
          </Button>
          <Button
            status="danger"
            icon={<IconDelete />}
            onClick={handleBatchDelete}
            disabled={selectedRowKeys.length === 0}
          >
            批量删除
          </Button>
          <Button icon={<IconSearch />} onClick={handleSearch}>
            查询
          </Button>
          <Button icon={<IconRefresh />} onClick={handleReset}>
            重置
          </Button>
        </Space>

        {/* 用户表格 */}
        <Table
          columns={columns}
          data={users}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: users.length,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
            sizeCanChange: true,
            onChange: (page, pageSize) => {
              setSearchParams({ ...searchParams, page, pageSize });
            },
          }}
        />
      </Card>

      {/* 新建/编辑用户弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        visible={visible}
        onOk={form.submit}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户名"
                field="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="真实姓名"
                field="realName"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入真实姓名" />
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
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                field="email"
                rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="性别"
                field="gender"
              >
                <Select placeholder="请选择性别">
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
                <Input placeholder="请输入昵称" />
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
                <Select placeholder="请选择用户类型">
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
                <Select placeholder="请选择用户状态">
                  <Option value="active">正常</Option>
                  <Option value="inactive">禁用</Option>
                  <Option value="suspended">暂停</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              label="密码"
              field="password"
              rules={[
                { required: true, message: '请输入密码' },
                { minLength: 6, message: '密码至少6位' }
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
} 