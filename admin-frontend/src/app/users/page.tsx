'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
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
  IconUserGroup
} from '@arco-design/web-react/icon';
import { API_ENDPOINTS } from '@/config/api';


const { Option } = Select;
const { Row: GridRow, Col } = Grid;

// 用户数据接口
interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  nickname?: string;
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
}

// API调用函数
const fetchUsers = async (page: number = 1, limit: number = 10, searchParams?: any): Promise<{list: User[], total: number}> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // 添加搜索参数
    if (searchParams?.username) params.append('username', searchParams.username);
    if (searchParams?.nickname) params.append('nickname', searchParams.nickname);
    if (searchParams?.phone) params.append('phone', searchParams.phone);
    if (searchParams?.email) params.append('email', searchParams.email);

    
    const response = await fetch(`${API_ENDPOINTS.users}?${params.toString()}`, {
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
    const response = await fetch(API_ENDPOINTS.roles, {
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
    const response = await fetch(API_ENDPOINTS.users, {
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
    const response = await fetch(`${API_ENDPOINTS.users}/${id}`, {
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
    const response = await fetch(`${API_ENDPOINTS.users}/${id}`, {
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

const resetPassword = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.users}/${id}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('重置密码失败:', error);
    return false;
  }
};

const deleteMultipleUsers = async (ids: number[]): Promise<boolean> => {
  try {
    const response = await fetch(API_ENDPOINTS.users, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('批量删除用户失败:', error);
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

  // 获取权限信息
  const { hasButtonPermission, isAdmin } = usePermissions();

  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 多选状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  // 重置密码成功弹窗状态
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);
  const [resetUserInfo, setResetUserInfo] = useState<{ username: string; nickname: string } | null>(null);



  // 加载数据
  const loadData = async () => {
      setLoading(true);
    try {
      // 构造搜索参数
      const searchParams: any = {};
      if (searchKeyword) {
        searchParams.username = searchKeyword;
        searchParams.nickname = searchKeyword;
        searchParams.phone = searchKeyword;
        searchParams.email = searchKeyword;
      }

      
      const [usersData, rolesData] = await Promise.all([
        fetchUsers(currentPage, pageSize, searchParams),
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
  }, [currentPage, pageSize, searchKeyword]);

  // 统计数据
  const stats = {
    total: total,
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
      title: '上次登录时间',
      dataIndex: 'lastLoginTime',
      width: 160,
      render: (time: string) => (
        <div style={{ color: '#64748b', fontSize: '12px' }}>
          {time ? new Date(time).toLocaleString() : '从未登录'}
        </div>
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
      width: 160,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        // 系统管理员（admin）不可编辑、删除、重置密码
        if (record.username === 'admin') {
          return (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <span style={{ color: '#86909C', fontSize: '12px' }}>系统用户</span>
            </div>
          );
        }

        const buttons = [];

        // 编辑按钮 - 需要编辑权限
        if (isAdmin() || hasButtonPermission('btn.users.edit')) {
          buttons.push(
            <Button
              key="edit"
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
          );
        }

        // 重置密码按钮 - 需要重置密码权限
        if (isAdmin() || hasButtonPermission('btn.users.reset')) {
          buttons.push(
            <Popconfirm
              key="reset"
              title="确认重置此用户密码？重置后密码将变为用户名"
              onOk={() => handleResetPassword(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                icon={<IconLock />}
                style={{
                  color: '#f59e0b',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              />
            </Popconfirm>
          );
        }

        // 删除按钮 - 需要删除权限
        if (isAdmin() || hasButtonPermission('btn.users.delete')) {
          buttons.push(
            <Popconfirm
              key="delete"
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
          );
        }

        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {buttons.length > 0 ? buttons : <span style={{ color: '#86909C', fontSize: '12px' }}>无权限</span>}
          </div>
        );
      },
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
      roleId: user.roles?.[0]?.id || null  // 取第一个角色的ID，因为现在是单选
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

  const handleResetPassword = async (id: number) => {
    try {
      // 先获取用户信息
      const user = data.find(u => u.id === id);
      if (!user) {
        Message.error('用户不存在');
        return;
      }

      const success = await resetPassword(id);
      if (success) {
        // 设置用户信息并显示成功弹窗
        setResetUserInfo({
          username: user.username,
          nickname: user.nickname || ''
        });
        setShowResetSuccessModal(true);
        loadData();
      } else {
        Message.error('重置密码失败');
      }
    } catch (error) {
      Message.error('重置密码失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请选择要删除的用户');
      return;
    }

    try {
      const success = await deleteMultipleUsers(selectedRowKeys);
      if (success) {
        Message.success(`成功删除 ${selectedRowKeys.length} 个用户`);
        setSelectedRowKeys([]);
        loadData();
      } else {
        Message.error('批量删除失败');
      }
    } catch (error) {
      Message.error('批量删除失败');
    }
  };



  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 处理角色字段：将roleId转换为后端期望的格式
      const submitData = {
        ...values,
        // 如果是编辑模式且只修改角色，确保roleId字段正确传递
      };

      const success = editingUser
        ? await updateUser(editingUser.id, submitData)
        : await createUser(submitData);

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
        <Col span={12}>
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

        <Col span={12}>
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
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* 新增用户按钮 - 需要新增权限 */}
                {(isAdmin() || hasButtonPermission('btn.users.add')) && (
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
                )}

                {/* 批量删除按钮 - 需要删除权限 */}
                {(isAdmin() || hasButtonPermission('btn.users.delete')) && (
                  <Popconfirm
                    title={`确认删除选中的 ${selectedRowKeys.length} 个用户？`}
                    onOk={handleBatchDelete}
                    okText="确认"
                    cancelText="取消"
                    disabled={selectedRowKeys.length === 0}
                  >
                    <Button
                      type="primary"
                      status="danger"
                      icon={<IconDelete />}
                      disabled={selectedRowKeys.length === 0}
                      style={{
                        height: '40px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      批量删除 ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
              </div>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          data={data}
          rowKey="id"
          loading={loading}
          pagination={false}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            onChange: (selectedRowKeys) => {
              setSelectedRowKeys(selectedRowKeys as number[]);
            },
          }}
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
          {!editingUser && (
            <>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>账户 <span style={{ color: '#ef4444' }}>*</span></span>}
                field="username"
                rules={[{ required: true, message: '请输入账户名' }]}
              >
                <Input
                  placeholder="请输入账户名"
                  style={{
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>

              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>角色</span>}
                field="roleId"
              >
                <Select
                  placeholder="请选择角色"
                  style={{
                    borderRadius: '6px',
                    height: '36px'
                  }}
                >
                  {roles.map(role => (
                    <Option key={role.id} value={role.id}>
                      {role.roleName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>昵称 <span style={{ color: '#ef4444' }}>*</span></span>}
                field="nickname"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input
                  placeholder="请输入昵称"
                  style={{
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>

              <div style={{
                padding: '12px',
                backgroundColor: '#f6f8fa',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#666'
              }}>
                <div>💡 <strong>说明：</strong></div>
                <div>• 账户：只能英语+数字</div>
                <div>• 角色：从角色列表中选择，角色默认为空</div>
                <div>• 昵称：可中文</div>
                <div>• 密码：默认生成，与账户名相同</div>
              </div>
            </>
          )}

          {/* 编辑模式下显示用户基本信息（只读） */}
          {editingUser && (
            <div style={{
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#475569' }}>
                用户基本信息（不可修改）
              </div>
              <GridRow gutter={16}>
                <Col span={8}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>用户名</span>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{editingUser.username}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>昵称</span>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{editingUser.nickname || '-'}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>手机号</span>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{editingUser.phone || '-'}</div>
                  </div>
                </Col>
              </GridRow>
            </div>
          )}

          {/* 新增用户时不显示密码字段，系统自动生成 */}

          {editingUser && (
            <Form.Item
              label={<span style={{ fontSize: '14px', fontWeight: '500' }}>
                角色
              </span>}
              field="roleId"
            >
              <Select
                placeholder="请选择角色"
                style={{
                  borderRadius: '6px',
                  height: '36px'
                }}
              >
                {roles.map(role => (
                  <Option key={role.id} value={role.id}>
                    {role.roleName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          </Form>
      </Modal>

      {/* 重置密码成功弹窗 */}
      <Modal
        title="密码重置成功"
        visible={showResetSuccessModal}
        onCancel={() => setShowResetSuccessModal(false)}
        footer={[
          <Button
            key="confirm"
            type="primary"
            onClick={() => setShowResetSuccessModal(false)}
          >
            确认
          </Button>
        ]}
        maskClosable={false}
        closable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '16px', color: '#52C41A', marginBottom: '12px' }}>
            ✅ 密码重置成功！
          </div>
          {resetUserInfo && (
            <div style={{ fontSize: '14px', color: '#86909C', lineHeight: '1.6' }}>
              <p>用户：<strong>{resetUserInfo.nickname}</strong>（{resetUserInfo.username}）</p>
              <p>新密码已重置为：<strong style={{ color: '#1890ff' }}>{resetUserInfo.username}</strong></p>
              <p style={{ color: '#F53F3F', fontSize: '12px', marginTop: '8px' }}>
                该用户下次登录时需要修改密码
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}