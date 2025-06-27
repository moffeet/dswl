'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Input, 
  Select, 
  Modal, 
  Form, 
  Message, 
  Popconfirm, 
  Tag, 
  Switch, 
  Badge,
  Pagination,
  Grid
} from '@arco-design/web-react';
import type { ColumnProps } from '@arco-design/web-react/lib/Table';
import { 
  IconPlus, 
  IconEdit, 
  IconDelete, 
  IconSearch, 
  IconRefresh, 
  IconUser,
  IconLock,
  IconCheckCircle,
  IconUserGroup
} from '@arco-design/web-react/icon';

const { TextArea } = Input;
const { Option } = Select;
const { Row: GridRow, Col } = Grid;

// 用户数据接口
interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  nickname?: string;
  status: 'normal' | 'disabled';
  roles: Role[];  // 暂时保留，避免前端错误
  createTime: string;
  updateTime: string;
}

// 角色数据接口
interface Role {
  id: number;
  roleName: string;
  roleCode: string;
  description: string;
  status: '启用' | '禁用';
}

// API调用函数
const fetchUsers = async (page: number = 1, size: number = 10): Promise<{list: User[], total: number}> => {
  try {
    const response = await fetch(`http://localhost:3000/users?page=${page}&size=${size}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    if (result.code === 200) {
      return {
        list: result.data.list || [],
        total: result.data.total || 0
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return { list: [], total: 0 };
  }
};

const fetchRoles = async (): Promise<Role[]> => {
  try {
    const response = await fetch('http://localhost:3000/roles', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    if (result.code === 200) {
      return result.data.list || [];
    }
    return [];
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return [];
  }
};

const createUser = async (data: any): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('创建用户失败:', error);
    return false;
  }
};

const updateUser = async (id: number, data: any): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3000/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('更新用户失败:', error);
    return false;
  }
};

const deleteUser = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3000/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('删除用户失败:', error);
    return false;
  }
};

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        fetchUsers(currentPage, pageSize),
        fetchRoles()
      ]);
      setData(usersData.list);
      setTotal(usersData.total);
      setRoles(rolesData);
    } catch (error) {
      Message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  // 统计数据
  const stats = {
    total: total,
    active: data.filter(user => user.status === 'normal').length,
    inactive: data.filter(user => user.status === 'disabled').length,
    withRoles: data.filter(user => user.roles && user.roles.length > 0).length
  };

  // 表格列定义
  const columns: ColumnProps[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      align: 'center',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      render: (username: string) => (
        <div style={{ fontWeight: '500', color: '#1e293b' }}>
          {username}
        </div>
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 180,
      render: (email: string) => (
        <div style={{ color: '#64748b' }}>
          {email}
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 120,
    },
    {
      title: '角色',
      key: 'roles',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {record.roles?.map((role: Role) => (
            <Tag key={role.id} color="arcoblue" size="small">
              {role.roleName}
            </Tag>
          )) || <Tag color="gray" size="small">无角色</Tag>}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => (
        <Badge
          status={status === 'normal' ? 'success' : 'default'}
          text={status === 'normal' ? '启用' : '禁用'}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      render: (time: string) => (
        <div style={{ color: '#64748b', fontSize: '12px' }}>
          {new Date(time).toLocaleString()}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
            style={{
              color: '#3b82f6',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          />
          <Popconfirm
            title="确认删除此用户？"
            onOk={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              icon={<IconDelete />}
              style={{
                color: '#ef4444',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) {
      setPageSize(size);
    }
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSelectedStatus('');
    setSelectedRole('');
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      roleIds: user.roles?.map(role => role.id) || []
    });
    setVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const success = await deleteUser(id);
      if (success) {
        Message.success('删除成功');
        loadData();
      } else {
        Message.error('删除失败');
      }
    } catch (error) {
      Message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const success = editingUser
        ? await updateUser(editingUser.id, values)
        : await createUser(values);
      
      if (success) {
        Message.success(editingUser ? '更新成功' : '创建成功');
        setVisible(false);
        form.resetFields();
        loadData();
      } else {
        Message.error(editingUser ? '更新失败' : '创建失败');
      }
    } catch (error) {
      Message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#f5f6fa', 
      minHeight: '100vh' 
    }}>
      {/* 统计卡片区域 */}
      <GridRow gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '8px' }}>
                  总用户数
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.total}
                </div>
              </div>
              <IconUser style={{ color: 'white', fontSize: '32px' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #48c9b0 0%, #158f89 100%)',
            border: 'none',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '8px' }}>
                  启用用户
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.active}
                </div>
              </div>
              <IconCheckCircle style={{ color: 'white', fontSize: '32px' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            border: 'none',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '8px' }}>
                  禁用用户
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.inactive}
                </div>
              </div>
              <IconLock style={{ color: 'white', fontSize: '32px' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #fd9644 0%, #f7931e 100%)',
            border: 'none',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginBottom: '8px' }}>
                  已分配角色
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.withRoles}
                </div>
              </div>
              <IconUserGroup style={{ color: 'white', fontSize: '32px' }} />
            </div>
          </Card>
        </Col>
      </GridRow>

      {/* 主内容卡片 */}
      <Card 
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e6eb'
        }}
      >
        {/* 搜索区域 */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <Input
              placeholder="请输入用户名或邮箱"
              value={searchKeyword}
              onChange={setSearchKeyword}
              style={{ 
                width: '200px',
                borderRadius: '8px'
              }}
              prefix={<IconSearch />}
            />
            
            <Select
              placeholder="状态"
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ 
                width: '120px',
                borderRadius: '8px'
              }}
              allowClear
            >
              <Option value="normal">启用</Option>
              <Option value="disabled">禁用</Option>
            </Select>

            <Select
              placeholder="角色"
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ 
                width: '150px',
                borderRadius: '8px'
              }}
              allowClear
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.roleName}
                </Option>
              ))}
            </Select>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                icon={<IconSearch />}
                style={{
                  borderRadius: '8px',
                  height: '36px'
                }}
              >
                搜索
              </Button>
              <Button
                icon={<IconRefresh />}
                onClick={handleReset}
                style={{
                  borderRadius: '8px',
                  height: '36px'
                }}
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ 
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <IconUser style={{ color: '#3b82f6' }} />
            用户管理
          </div>
          <Button
            type="primary"
            icon={<IconPlus />} 
            onClick={handleAdd}
            style={{
              height: '40px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            新增用户
          </Button>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          data={data}
          rowKey="id"
          loading={loading}
          pagination={false}
          style={{
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />

        {/* 分页 */}
        <div style={{ 
          marginTop: '24px', 
          textAlign: 'right' 
        }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
            showJumper
            onChange={handlePageChange}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            sizeOptions={[10, 20, 50, 100]}
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          />
        </div>
      </Card>

      {/* 新建/编辑用户弹窗 */}
      <Modal
        title={
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#1e293b'
          }}>
            {editingUser ? '编辑用户' : '新增用户'}
          </div>
        }
        visible={visible}
        onOk={form.submit}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        style={{
          borderRadius: '12px',
          width: '600px'
        }}
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '6px'
          }
        }}
        cancelButtonProps={{
          style: {
            borderRadius: '6px'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          style={{ marginTop: '16px' }}
        >
          <GridRow gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>用户名</span>}
                field="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  placeholder="请输入用户名" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>昵称</span>}
                field="nickname"
              >
                <Input 
                  placeholder="请输入昵称" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
          </GridRow>

          <GridRow gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>邮箱</span>}
                field="email"
                rules={[
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  placeholder="请输入邮箱" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>手机号</span>}
                field="phone"
              >
                <Input 
                  placeholder="请输入手机号" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
          </GridRow>

          {!editingUser && (
            <Form.Item
              label={<span style={{ fontSize: '14px', fontWeight: '500' }}>密码</span>}
              field="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                placeholder="请输入密码" 
                style={{ 
                  borderRadius: '6px',
                  height: '36px'
                }}
              />
            </Form.Item>
          )}

          <GridRow gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>角色</span>}
                field="roleIds"
              >
                <Select 
                  placeholder="请选择角色"
                  mode="multiple"
                  style={{ 
                    borderRadius: '6px',
                    minHeight: '36px'
                  }}
                >
                  {roles.map(role => (
                    <Option key={role.id} value={role.id}>
                      {role.roleName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>状态</span>}
                field="status"
                initialValue="normal"
              >
                <Select 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                >
                  <Option value="normal">启用</Option>
                  <Option value="disabled">禁用</Option>
                </Select>
              </Form.Item>
            </Col>
          </GridRow>
        </Form>
      </Modal>
    </div>
  );
} 