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
  Tag, 
  Pagination,
  Grid
} from '@arco-design/web-react';
import { 
  IconPlus, 
  IconEdit, 
  IconDelete, 
  IconSearch, 
  IconRefresh, 
  IconSettings,
  IconMenuFold,
  IconLock,
  IconCheckCircle
} from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/lib/Table';
import { API_ENDPOINTS } from '@/config/api';

const { Option } = Select;
const { Row: GridRow, Col } = Grid;

// 菜单权限数据接口
interface MenuPermission {
  id: number;
  permissionName: string;
  permissionCode: string;
  permissionType: 'menu' | 'button';
  parentId: number;
  path?: string;
  component?: string;
  icon?: string;
  sortOrder: number;
  status: 'normal' | 'disabled';
  createTime: string;
  updateTime: string;
  children?: MenuPermission[];
}

// API调用函数
const fetchMenuPermissions = async (page: number = 1, limit: number = 10, searchParams?: any): Promise<{list: MenuPermission[], total: number}> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // 添加搜索参数
    if (searchParams?.permissionName) params.append('permissionName', searchParams.permissionName);
    if (searchParams?.permissionCode) params.append('permissionCode', searchParams.permissionCode);
    if (searchParams?.permissionType) params.append('permissionType', searchParams.permissionType);
    if (searchParams?.status) params.append('status', searchParams.status);
    
    const response = await fetch(`${API_ENDPOINTS.permissions}?${params.toString()}`, {
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
    console.error('获取权限列表失败:', error);
    return { list: [], total: 0 };
  }
};

const createPermission = async (data: any): Promise<boolean> => {
  try {
    const response = await fetch(API_ENDPOINTS.permissions, {
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
    console.error('创建权限失败:', error);
    return false;
  }
};

const updatePermission = async (id: number, data: any): Promise<boolean> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.permissions}/${id}`, {
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
    console.error('更新权限失败:', error);
    return false;
  }
};

const deletePermission = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.permissions}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('删除权限失败:', error);
    return false;
  }
};

// 权限类型选项
const permissionTypeOptions = [
  { label: '菜单权限', value: 'menu' },
  { label: '按钮权限', value: 'button' }
];

// 状态选项
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '正常', value: 'normal' },
  { label: '禁用', value: 'disabled' }
];

export default function MenusPage() {
  const [permissions, setPermissions] = useState<MenuPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState<MenuPermission | null>(null);
  const [form] = Form.useForm();
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 加载权限数据
  const loadPermissions = async () => {
    setLoading(true);
    try {
      // 构造搜索参数
      const searchParams: any = {};
      if (searchKeyword) {
        searchParams.permissionName = searchKeyword;
        searchParams.permissionCode = searchKeyword;
      }
      if (selectedType) searchParams.permissionType = selectedType;
      if (selectedStatus) searchParams.status = selectedStatus;
      
      const data = await fetchMenuPermissions(currentPage, pageSize, searchParams);
      setPermissions(data.list);
      setTotal(data.total);
    } catch (error) {
      Message.error('加载权限数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [currentPage, pageSize, searchKeyword, selectedType, selectedStatus]);

  // 统计数据 - 显示搜索结果统计
  const stats = {
    total: total,
    menu: permissions.filter(p => p.permissionType === 'menu').length,
    button: permissions.filter(p => p.permissionType === 'button').length,
    disabled: permissions.filter(p => p.status === 'disabled').length,
  };

  // 表格列定义
  const columns: ColumnProps<MenuPermission>[] = [
    {
      title: '权限信息',
      dataIndex: 'permissionName',
      key: 'permissionName',
      width: 250,
      render: (text: string, record: MenuPermission) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: record.permissionType === 'menu' 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #48c9b0 0%, #158f89 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
          }}>
            {record.permissionType === 'menu' ? <IconMenuFold /> : <IconLock />}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
              {text}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {record.permissionCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'permissionType',
      key: 'permissionType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'menu' ? 'blue' : 'green'} style={{ borderRadius: '12px' }}>
          {type === 'menu' ? '菜单' : '按钮'}
        </Tag>
      ),
    },
    {
      title: '路径/组件',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      render: (path: string, record: MenuPermission) => (
        <div>
          {path && (
            <div style={{ fontSize: '13px', color: '#475569' }}>
              路径: {path}
            </div>
          )}
          {record.component && (
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              组件: {record.component}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      align: 'center',
      render: (order: number) => (
        <Tag style={{ 
          backgroundColor: '#f1f5f9',
          color: '#475569',
          border: 'none',
          borderRadius: '6px'
        }}>
          {order}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => (
        <Tag color={status === 'normal' ? 'green' : 'red'} style={{ borderRadius: '12px' }}>
          {status === 'normal' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (text: string) => (
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          {text ? new Date(text).toLocaleString() : '-'}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (text: any, record: MenuPermission) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
            style={{
              color: '#3b82f6',
              borderRadius: '6px',
              padding: '4px 8px'
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<IconDelete />}
            onClick={() => handleDelete(record.id)}
            style={{
              color: '#ef4444',
              borderRadius: '6px',
              padding: '4px 8px'
            }}
          />
        </div>
      ),
    },
  ];

  const handleReset = () => {
    setSearchKeyword('');
    setSelectedType('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setEditingPermission(null);
    form.resetFields();
    setVisible(true);
  };

  const handleEdit = (permission: MenuPermission) => {
    setEditingPermission(permission);
    form.setFieldsValue({
      ...permission,
    });
    setVisible(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('确定要删除这个权限吗？删除后不可恢复！')) {
      setLoading(true);
      try {
        const success = await deletePermission(id);
        if (success) {
          Message.success('删除成功');
          loadPermissions();
        } else {
          Message.error('删除失败');
        }
      } catch (error) {
        Message.error('删除失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      let success = false;
      if (editingPermission) {
        success = await updatePermission(editingPermission.id, values);
      } else {
        success = await createPermission(values);
      }

      if (success) {
        Message.success(editingPermission ? '更新成功' : '创建成功');
        setVisible(false);
        form.resetFields();
        loadPermissions();
      } else {
        Message.error(editingPermission ? '更新失败' : '创建失败');
      }
    } catch (error) {
      Message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 分页由后端处理，直接使用permissions数据
  const paginatedData = permissions;

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
                  总权限数
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.total}
                </div>
              </div>
              <IconSettings style={{ color: 'white', fontSize: '32px' }} />
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
                  菜单权限
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.menu}
                </div>
              </div>
              <IconMenuFold style={{ color: 'white', fontSize: '32px' }} />
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
                  按钮权限
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.button}
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
                  禁用权限
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.disabled}
                </div>
              </div>
              <IconCheckCircle style={{ color: 'white', fontSize: '32px' }} />
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
              placeholder="请输入权限名称或编码"
              value={searchKeyword}
              onChange={setSearchKeyword}
              style={{ 
                width: '200px',
                borderRadius: '8px'
              }}
              prefix={<IconSearch />}
            />
            
            <Select
              placeholder="权限类型"
              value={selectedType}
              onChange={setSelectedType}
              style={{ 
                width: '120px',
                borderRadius: '8px'
              }}
              allowClear
            >
              {permissionTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>

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
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
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
            <IconMenuFold style={{ color: '#3b82f6' }} />
            菜单权限管理
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
            新增权限
          </Button>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          data={paginatedData}
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
            onChange={(page, size) => {
              setCurrentPage(page);
              if (size) setPageSize(size);
            }}
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          />
        </div>
      </Card>

      {/* 新建/编辑权限弹窗 */}
      <Modal
        title={
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#1e293b'
          }}>
            {editingPermission ? '编辑权限' : '新增权限'}
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
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>权限名称</span>}
                field="permissionName"
                rules={[{ required: true, message: '请输入权限名称' }]}
              >
                <Input 
                  placeholder="请输入权限名称" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>权限编码</span>}
                field="permissionCode"
                rules={[{ required: true, message: '请输入权限编码' }]}
              >
                <Input 
                  placeholder="如: menu.system.users" 
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
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>权限类型</span>}
                field="permissionType"
                rules={[{ required: true, message: '请选择权限类型' }]}
              >
                <Select 
                  placeholder="请选择权限类型"
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                >
                  {permissionTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>排序</span>}
                field="sortOrder"
                rules={[{ required: true, message: '请输入排序值' }]}
              >
                <Input 
                  type="number"
                  placeholder="排序值" 
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
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>菜单路径</span>}
                field="path"
              >
                <Input 
                  placeholder="如: /users" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>组件名称</span>}
                field="component"
              >
                <Input 
                  placeholder="如: UserManage" 
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
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>图标</span>}
                field="icon"
              >
                <Input 
                  placeholder="如: IconUser" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>父级权限ID</span>}
                field="parentId"
                initialValue={0}
              >
                <Input 
                  type="number"
                  placeholder="0表示顶级" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
          </GridRow>

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
              <Option value="normal">正常</Option>
              <Option value="disabled">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
