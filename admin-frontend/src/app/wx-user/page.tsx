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
  IconMobile,
  IconUnlock
} from '@arco-design/web-react/icon';
import { API_ENDPOINTS } from '@/config/api';

const { Option } = Select;
const { Row: GridRow, Col } = Grid;

// 小程序用户数据接口
interface WxUser {
  id: number;
  name: string;
  phone: string;
  role: '司机' | '销售';
  wechatId?: string;
  deviceId?: string;
  createTime: string;
  updateTime: string;
}

// API调用函数
const fetchWxUsers = async (page: number = 1, limit: number = 10, searchParams?: any): Promise<{list: WxUser[], total: number}> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // 添加搜索参数
    if (searchParams?.name) params.append('name', searchParams.name);
    if (searchParams?.phone) params.append('phone', searchParams.phone);
    if (searchParams?.role) params.append('role', searchParams.role);
    if (searchParams?.wechatId) params.append('wechatId', searchParams.wechatId);
    
    const response = await fetch(`${API_ENDPOINTS.wxUsers}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('网络请求失败');
    }

    const result = await response.json();
    if (result.code === 200) {
      return {
        list: result.data.list || [],
        total: result.data.total || 0
      };
    } else {
      throw new Error(result.message || '获取数据失败');
    }
  } catch (error) {
    console.error('获取小程序用户列表失败:', error);
    throw error;
  }
};

const createWxUser = async (userData: Partial<WxUser>): Promise<boolean> => {
  try {
    const response = await fetch(API_ENDPOINTS.wxUsers, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('创建小程序用户失败:', error);
    return false;
  }
};

const updateWxUser = async (id: number, userData: Partial<WxUser>): Promise<boolean> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.wxUsers}/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('更新小程序用户失败:', error);
    return false;
  }
};

const deleteWxUser = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.wxUsers}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('删除小程序用户失败:', error);
    return false;
  }
};

const resetDeviceBinding = async (id: number): Promise<{ success: boolean; data?: any }> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.wxUsers}/${id}/reset-device`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return {
      success: result.code === 200,
      data: result.data
    };
  } catch (error) {
    console.error('重置设备绑定失败:', error);
    return { success: false };
  }
};

export default function WxUserManage() {
  const [data, setData] = useState<WxUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<WxUser | null>(null);
  const [form] = Form.useForm();
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 构造搜索参数
      const searchParams: any = {};
      if (searchKeyword) {
        searchParams.name = searchKeyword;
        searchParams.phone = searchKeyword;
        searchParams.wechatId = searchKeyword;
      }
      if (selectedRole) {
        searchParams.role = selectedRole;
      }

      const result = await fetchWxUsers(currentPage, pageSize, searchParams);
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      Message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

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

  const handleEdit = (user: WxUser) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const success = await deleteWxUser(id);
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

  const handleResetDevice = async (id: number, userName: string) => {
    try {
      const result = await resetDeviceBinding(id);
      if (result.success) {
        Message.success({
          content: `用户 ${userName} 的设备绑定已重置，用户需要重新登录`,
          duration: 5000
        });
        loadData(); // 刷新列表
      } else {
        Message.error('重置设备绑定失败');
      }
    } catch (error) {
      Message.error('重置设备绑定失败');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const success = editingUser
        ? await updateWxUser(editingUser.id, values)
        : await createWxUser(values);

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

  const columns: ColumnProps[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 140,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={role === '司机' ? 'blue' : 'green'}>
          {role}
        </Tag>
      ),
    },
    {
      title: '微信ID',
      dataIndex: 'wechatId',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: '设备状态',
      dataIndex: 'deviceId',
      width: 180,
      render: (deviceId: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {deviceId ? (
            <>
              <Tag color="green" size="small">已绑定</Tag>
              <span style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }} title={`设备ID: ${deviceId}`}>
                {deviceId.length > 12 ? `${deviceId.substring(0, 12)}...` : deviceId}
              </span>
            </>
          ) : (
            <Tag color="orange" size="small">未绑定</Tag>
          )}
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      width: 200,
      render: (_, record: WxUser) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
            style={{ color: '#3b82f6' }}
          >
            编辑
          </Button>
          <Popconfirm
            title={`确定要重置用户 ${record.name} 的设备绑定吗？`}
            content="重置后用户需要重新登录才能使用小程序"
            onOk={() => handleResetDevice(record.id, record.name)}
            okText="确认重置"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              icon={<IconUnlock />}
              style={{ color: '#f59e0b' }}
              title="重置设备绑定"
            >
              重置设备
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确定要删除这个小程序用户吗？"
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
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <GridRow gutter={16}>
            <Col span={6}>
              <Input
                placeholder="搜索姓名/手机号/微信ID"
                value={searchKeyword}
                onChange={setSearchKeyword}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择角色"
                value={selectedRole}
                onChange={setSelectedRole}
                allowClear
              >
                <Option value="司机">司机</Option>
                <Option value="销售">销售</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
                搜索
              </Button>
              <Button style={{ marginLeft: '8px' }} icon={<IconRefresh />} onClick={handleReset}>
                重置
              </Button>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
                新增小程序用户
              </Button>
            </Col>
          </GridRow>
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          pagination={false}
          rowKey="id"
        />

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
          />
        </div>
      </Card>

      <Modal
        title={editingUser ? '编辑小程序用户' : '新增小程序用户'}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
        >
          <Form.Item
            label="姓名"
            field="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

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

          <Form.Item
            label="角色"
            field="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="司机">司机</Option>
              <Option value="销售">销售</Option>
            </Select>
          </Form.Item>

          {/* 微信ID和MAC地址在小程序登录时自动获取，不在管理后台手动输入 */}

          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setVisible(false)} style={{ marginRight: '8px' }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingUser ? '更新' : '创建'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
