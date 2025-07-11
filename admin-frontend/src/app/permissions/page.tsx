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

// 权限数据接口
interface Permission {
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
  children?: Permission[];
}

// API调用函数
const fetchPermissions = async (page: number = 1, limit: number = 10, searchParams?: any): Promise<{list: Permission[], total: number}> => {
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

// 获取所有权限用于父级权限选择
const fetchAllPermissions = async (): Promise<Permission[]> => {
  try {
    const token = localStorage.getItem('token');
    console.log('🔑 当前token:', token ? `${token.substring(0, 20)}...` : '无token');

    // 使用完整权限树接口，包含菜单和按钮权限
    const response = await fetch(`${API_ENDPOINTS.permissions}/complete-tree`, {
      headers: {
        'Authorization': `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ 获取权限树失败:', response.status, response.statusText);
      return [];
    }

    const result = await response.json();
    console.log('📊 权限树API响应:', result);

    if (result.code === 200) {
      const permissions = result.data || [];
      console.log('✅ 成功获取权限树:', permissions.length, '个权限');
      return permissions;
    } else {
      console.error('❌ 权限树API返回错误:', result.message);
      return [];
    }
  } catch (error) {
    console.error('❌ 获取权限树异常:', error);
    return [];
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

// 图标选项
const iconOptions = [
  { label: '用户', value: 'IconUser' },
  { label: '用户组', value: 'IconUserGroup' },
  { label: '设置', value: 'IconSettings' },
  { label: '菜单', value: 'IconMenuFold' },
  { label: '锁定', value: 'IconLock' },
  { label: '位置', value: 'IconLocation' },
  { label: '文件', value: 'IconFileText' },
  { label: '手机', value: 'IconMobile' },
  { label: '地图', value: 'IconMap' },
  { label: '首页', value: 'IconHome' }
];

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 搜索状态
  const [searchForm] = Form.useForm();
  const [searchParams, setSearchParams] = useState<any>({});
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [form] = Form.useForm();

  // 加载权限列表
  const loadPermissions = async (page: number = current, size: number = pageSize, search: any = searchParams) => {
    setLoading(true);
    try {
      const result = await fetchPermissions(page, size, search);
      setPermissions(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('加载权限列表失败:', error);
      Message.error('加载权限列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载所有权限（用于父级权限选择）
  const loadAllPermissions = async () => {
    try {
      const result = await fetchAllPermissions();
      setAllPermissions(result);
    } catch (error) {
      console.error('加载权限树失败:', error);
    }
  };

  useEffect(() => {
    loadPermissions();
    loadAllPermissions();
  }, []);

  // 搜索处理
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchParams(values);
    setCurrent(1);
    loadPermissions(1, pageSize, values);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({});
    setCurrent(1);
    loadPermissions(1, pageSize, {});
  };

  // 刷新
  const handleRefresh = () => {
    loadPermissions();
    loadAllPermissions();
  };

  // 分页处理
  const handlePageChange = (page: number, size: number) => {
    setCurrent(page);
    setPageSize(size);
    loadPermissions(page, size);
  };

  // 新增权限
  const handleAdd = () => {
    setEditingPermission(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑权限
  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    form.setFieldsValue({
      ...permission,
      parentId: permission.parentId === 0 ? undefined : permission.parentId
    });
    setModalVisible(true);
  };

  // 删除权限
  const handleDelete = (permission: Permission) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除权限 "${permission.permissionName}" 吗？`,
      onOk: async () => {
        const success = await deletePermission(permission.id);
        if (success) {
          Message.success('删除成功');
          loadPermissions();
        } else {
          Message.error('删除失败');
        }
      },
    });
  };

  // 保存权限
  const handleSave = async () => {
    try {
      const values = await form.validate();

      // 处理父级权限ID
      const data = {
        ...values,
        parentId: values.parentId || 0
      };

      let success = false;
      if (editingPermission) {
        success = await updatePermission(editingPermission.id, data);
      } else {
        success = await createPermission(data);
      }

      if (success) {
        Message.success(editingPermission ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadPermissions();
        loadAllPermissions(); // 重新加载权限树
      } else {
        Message.error(editingPermission ? '更新失败' : '创建失败');
      }
    } catch (error) {
      console.error('保存权限失败:', error);
    }
  };

  // 渲染父级权限选项（只显示菜单权限）
  const renderParentOptions = (permissions: Permission[], level: number = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];

    permissions.forEach(permission => {
      // 只显示菜单权限作为父级选项
      if (permission.permissionType === 'menu') {
        const prefix = '　'.repeat(level);
        options.push(
          <Option key={permission.id} value={permission.id}>
            {prefix}{permission.permissionName}
          </Option>
        );

        // 递归处理子权限（只处理菜单权限的子菜单）
        if (permission.children && permission.children.length > 0) {
          options.push(...renderParentOptions(permission.children, level + 1));
        }
      }
    });

    return options;
  };

  // 表格列定义
  const columns: ColumnProps<Permission>[] = [
    {
      title: '权限信息',
      dataIndex: 'permissionName',
      key: 'permissionName',
      width: 250,
      render: (text: string, record: Permission) => (
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
      render: (path: string, record: Permission) => (
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
      title: '父级权限',
      dataIndex: 'parentId',
      key: 'parentId',
      width: 120,
      render: (parentId: number) => {
        if (parentId === 0) {
          return (
            <Tag style={{
              backgroundColor: '#e0f2fe',
              color: '#0277bd',
              border: 'none',
              borderRadius: '6px'
            }}>
              顶级
            </Tag>
          );
        }

        // 查找父级权限名称
        const findParentName = (permissions: Permission[], id: number): string => {
          for (const permission of permissions) {
            if (permission.id === id) {
              return permission.permissionName;
            }
            if (permission.children) {
              const found = findParentName(permission.children, id);
              if (found) return found;
            }
          }
          return `ID: ${id}`;
        };

        return (
          <Tag style={{
            backgroundColor: '#f3e8ff',
            color: '#7c3aed',
            border: 'none',
            borderRadius: '6px'
          }}>
            {findParentName(allPermissions, parentId)}
          </Tag>
        );
      },
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      render: (text: number) => (
        <Tag style={{
          backgroundColor: '#f1f5f9',
          color: '#475569',
          border: 'none',
          borderRadius: '6px'
        }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
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
      render: (text: any, record: Permission) => (
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
            onClick={() => handleDelete(record)}
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1e293b',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <IconLock size={20} />
          </div>
          权限管理
        </h1>
        <p style={{ color: '#64748b', margin: '8px 0 0 52px', fontSize: '14px' }}>
          管理系统菜单权限和按钮权限，控制用户访问范围
        </p>
      </div>

      {/* 搜索区域 */}
      <Card style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <Form form={searchForm} layout="inline" style={{ gap: '16px' }}>
          <Form.Item label="权限名称" field="permissionName">
            <Input
              placeholder="请输入权限名称"
              style={{ width: 200, borderRadius: '8px' }}
              prefix={<IconSearch />}
            />
          </Form.Item>
          <Form.Item label="权限编码" field="permissionCode">
            <Input
              placeholder="请输入权限编码"
              style={{ width: 200, borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item label="权限类型" field="permissionType">
            <Select
              placeholder="选择权限类型"
              style={{ width: 150, borderRadius: '8px' }}
              allowClear
            >
              {permissionTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="状态" field="status">
            <Select
              placeholder="选择状态"
              style={{ width: 120, borderRadius: '8px' }}
              allowClear
            >
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<IconSearch />}
              onClick={handleSearch}
              style={{ borderRadius: '8px' }}
            >
              搜索
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              icon={<IconRefresh />}
              onClick={handleReset}
              style={{ borderRadius: '8px' }}
            >
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作区域 */}
      <Card style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={handleAdd}
              style={{ borderRadius: '8px' }}
            >
              新增权限
            </Button>
            <Button
              icon={<IconRefresh />}
              onClick={handleRefresh}
              style={{ borderRadius: '8px' }}
            >
              刷新
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
            <span>共 {total} 条记录</span>
          </div>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <Table
          columns={columns}
          data={permissions}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          rowKey="id"
          style={{
            borderRadius: '8px',
          }}
        />

        {/* 分页 */}
        {total > 0 && (
          <div style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '16px'
          }}>
            <Pagination
              current={current}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
              pageSizeOptions={['10', '20', '50', '100']}
              style={{ borderRadius: '8px' }}
            />
          </div>
        )}
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingPermission ? '编辑权限' : '新增权限'}
        visible={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
        style={{ borderRadius: '12px' }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '16px' }}
        >
          <GridRow gutter={16}>
            <Col span={12}>
              <Form.Item
                label="权限名称"
                field="permissionName"
                rules={[{ required: true, message: '请输入权限名称' }]}
              >
                <Input placeholder="请输入权限名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="权限编码"
                field="permissionCode"
                rules={[{ required: true, message: '请输入权限编码' }]}
              >
                <Input placeholder="如: menu.users 或 btn.users.add" />
              </Form.Item>
            </Col>
          </GridRow>

          <GridRow gutter={16}>
            <Col span={12}>
              <Form.Item
                label="权限类型"
                field="permissionType"
                rules={[{ required: true, message: '请选择权限类型' }]}
              >
                <Select placeholder="选择权限类型">
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
                label="父级权限"
                field="parentId"
              >
                <Select placeholder="选择父级权限（可选）" allowClear>
                  {renderParentOptions(allPermissions)}
                </Select>
              </Form.Item>
            </Col>
          </GridRow>

          <GridRow gutter={16}>
            <Col span={12}>
              <Form.Item
                label="路径"
                field="path"
              >
                <Input placeholder="如: /users（菜单权限需要）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="组件"
                field="component"
              >
                <Input placeholder="组件路径（可选）" />
              </Form.Item>
            </Col>
          </GridRow>

          <GridRow gutter={16}>
            <Col span={12}>
              <Form.Item
                label="图标"
                field="icon"
              >
                <Select placeholder="选择图标（可选）" allowClear>
                  {iconOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="排序"
                field="sortOrder"
                rules={[{ required: true, message: '请输入排序值' }]}
              >
                <Input placeholder="数字，越小越靠前" type="number" />
              </Form.Item>
            </Col>
          </GridRow>

          <Form.Item
            label="状态"
            field="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              <Option value="normal">正常</Option>
              <Option value="disabled">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
