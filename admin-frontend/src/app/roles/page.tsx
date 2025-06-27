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
  Space,
  Statistic,
  Tree,
  Tabs,
  Grid
} from '@arco-design/web-react';
import type { ColumnProps } from '@arco-design/web-react/lib/Table';
import { 
  IconPlus, 
  IconEdit, 
  IconDelete, 
  IconSearch, 
  IconRefresh, 
  IconSettings,
  IconUser,
  IconLock,
  IconCheckCircle,
  IconUserGroup
} from '@arco-design/web-react/icon';

const { TextArea } = Input;
const { Option } = Select;
const { Row: GridRow, Col } = Grid;
const { TabPane } = Tabs;

// 角色数据接口
interface Role {
  id: number;
  roleName: string;
  roleCode: string;
  description: string;
  status: 'active' | 'inactive';
  miniAppLoginEnabled: boolean;
  permissions: Permission[];
  userCount?: number;
  createTime: string;
  updateTime: string;
}

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
const fetchRoles = async (page: number = 1, size: number = 10): Promise<{list: Role[], total: number}> => {
  try {
    const response = await fetch(`http://localhost:3000/roles?page=${page}&size=${size}`, {
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
    console.error('获取角色列表失败:', error);
    return { list: [], total: 0 };
  }
};

const fetchMenuPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await fetch('http://localhost:3000/permissions/menu-tree', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    if (result.code === 200) {
      return result.data || [];
    }
    return [];
  } catch (error) {
    console.error('获取菜单权限失败:', error);
    return [];
  }
};

const fetchButtonPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await fetch('http://localhost:3000/permissions/buttons', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    if (result.code === 200) {
      return result.data || [];
    }
    return [];
  } catch (error) {
    console.error('获取按钮权限失败:', error);
    return [];
  }
};

const createRole = async (data: any): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3000/roles', {
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
    console.error('创建角色失败:', error);
    return false;
  }
};

const updateRole = async (id: number, data: any): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3000/roles/${id}`, {
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
    console.error('更新角色失败:', error);
    return false;
  }
};

const deleteRole = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3000/roles/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('删除角色失败:', error);
    return false;
  }
};

const assignPermissions = async (roleId: number, permissionIds: number[]): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3000/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissionIds }),
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('分配权限失败:', error);
    return false;
  }
};

const toggleMiniAppLogin = async (roleId: number, enabled: boolean): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3000/roles/${roleId}/mini-app-login`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('切换小程序登录权限失败:', error);
    return false;
  }
};

export default function RolesPage() {
  const [data, setData] = useState<Role[]>([]);
  const [menuPermissions, setMenuPermissions] = useState<Permission[]>([]);
  const [buttonPermissions, setButtonPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMiniApp, setSelectedMiniApp] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 权限选择状态
  const [selectedMenuPermissions, setSelectedMenuPermissions] = useState<number[]>([]);
  const [selectedButtonPermissions, setSelectedButtonPermissions] = useState<number[]>([]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, menuData, buttonData] = await Promise.all([
        fetchRoles(currentPage, pageSize),
        fetchMenuPermissions(),
        fetchButtonPermissions()
      ]);
      setData(rolesData.list);
      setTotal(rolesData.total);
      setMenuPermissions(menuData);
      setButtonPermissions(buttonData);
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
    active: data.filter(role => role.status === 'active').length,
    inactive: data.filter(role => role.status === 'inactive').length,
    miniApp: data.filter(role => role.miniAppLoginEnabled).length
  };

  // 构建权限树数据
  const buildTreeData = (permissions: Permission[]): any[] => {
    return permissions.map(permission => ({
      title: permission.permissionName,
      key: permission.id.toString(),
      children: permission.children ? buildTreeData(permission.children) : undefined
    }));
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
      title: '角色名称',
      dataIndex: 'roleName',
      width: 120,
      render: (roleName: string) => (
        <div style={{ fontWeight: '500', color: '#1e293b' }}>
          {roleName}
        </div>
      ),
    },
    {
      title: '角色编码',
      dataIndex: 'roleCode',
      width: 120,
      render: (roleCode: string) => (
        <Tag color="blue" size="small">
          {roleCode}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200,
      render: (description: string) => (
        <div style={{ color: '#64748b' }}>
          {description}
        </div>
      ),
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permissionCount',
      align: 'center' as const,
      render: (permissions: any[]) => (
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-600">{permissions ? permissions.length : 0}</span>
        </div>
      ),
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      align: 'center' as const,
      render: (userCount: number) => (
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-gray-600">{userCount || 0}</span>
        </div>
      ),
    },
    {
      title: '小程序登录',
      dataIndex: 'miniAppLoginEnabled',
      width: 120,
      align: 'center',
      render: (enabled: boolean, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleMiniAppToggle(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={status === 'active' ? '启用' : '禁用'}
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
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      align: 'center' as const,
      render: (_, record) => (
        <div className="flex gap-2 justify-center">
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:text-blue-800"
          />
          <Popconfirm
            title="确认删除此角色？"
            onOk={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              icon={<IconDelete />}
              className="text-red-600 hover:text-red-800"
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
    setSelectedMiniApp('');
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setSelectedMenuPermissions([]);
    setSelectedButtonPermissions([]);
    setVisible(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      roleName: role.roleName,
      roleCode: role.roleCode,
      description: role.description,
      status: role.status,
      miniAppLoginEnabled: role.miniAppLoginEnabled
    });
    
    // 设置已选择的权限
    if (role.permissions) {
      const menuIds = role.permissions
        .filter(p => p.permissionType === 'menu')
        .map(p => p.id);
      const buttonIds = role.permissions
        .filter(p => p.permissionType === 'button')
        .map(p => p.id);
      
      setSelectedMenuPermissions(menuIds);
      setSelectedButtonPermissions(buttonIds);
    }
    
    setVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const success = await deleteRole(id);
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

  const handleMiniAppToggle = async (roleId: number, enabled: boolean) => {
    try {
      const success = await toggleMiniAppLogin(roleId, enabled);
      if (success) {
        Message.success('设置成功');
        loadData();
      } else {
        Message.error('设置失败');
      }
    } catch (error) {
      Message.error('设置失败');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 合并菜单权限和按钮权限
      const allPermissionIds = [...selectedMenuPermissions, ...selectedButtonPermissions];
      
      const roleData = {
        ...values,
        permissionIds: allPermissionIds
      };

      const success = editingRole
        ? await updateRole(editingRole.id, roleData)
        : await createRole(roleData);
      
      if (success) {
        Message.success(editingRole ? '更新成功' : '创建成功');
        setVisible(false);
        form.resetFields();
        setSelectedMenuPermissions([]);
        setSelectedButtonPermissions([]);
        loadData();
      } else {
        Message.error(editingRole ? '更新失败' : '创建失败');
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
                  总角色数
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.total}
                </div>
              </div>
              <IconUserGroup style={{ color: 'white', fontSize: '32px' }} />
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
                  启用角色
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
                  小程序角色
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.miniApp}
                </div>
              </div>
              <IconUser style={{ color: 'white', fontSize: '32px' }} />
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
                  禁用角色
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.inactive}
                </div>
              </div>
              <IconLock style={{ color: 'white', fontSize: '32px' }} />
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
              placeholder="请输入角色名称或编码"
              value={searchKeyword}
              onChange={(value) => setSearchKeyword(value)}
              style={{ 
                width: '200px',
                borderRadius: '8px'
              }}
              prefix={<IconSearch />}
            />
            
            <Select
              placeholder="状态"
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value)}
              style={{ 
                width: '120px',
                borderRadius: '8px'
              }}
              allowClear
            >
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>

            <Select
              placeholder="小程序登录"
              value={selectedMiniApp}
              onChange={(value) => setSelectedMiniApp(value)}
              style={{ 
                width: '150px',
                borderRadius: '8px'
              }}
              allowClear
            >
              <Option value="true">允许</Option>
              <Option value="false">禁止</Option>
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
            <IconUserGroup style={{ color: '#3b82f6' }} />
            角色管理
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
            新增角色
          </Button>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          data={data}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
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

      {/* 新建/编辑角色弹窗 */}
      <Modal
        title={
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#1e293b'
          }}>
            {editingRole ? '编辑角色' : '新增角色'}
          </div>
        }
        visible={visible}
        onOk={form.submit}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
          setSelectedMenuPermissions([]);
          setSelectedButtonPermissions([]);
        }}
        confirmLoading={loading}
        style={{
          borderRadius: '12px',
          width: '800px'
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
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>角色名称</span>}
                field="roleName"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input 
                  placeholder="请输入角色名称" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>角色编码</span>}
                field="roleCode"
                rules={[{ required: true, message: '请输入角色编码' }]}
              >
                <Input 
                  placeholder="请输入角色编码" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
          </GridRow>

          <Form.Item
            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>角色描述</span>}
            field="description"
          >
            <TextArea 
              placeholder="请输入角色描述" 
              rows={3}
              style={{ 
                borderRadius: '6px'
              }}
            />
          </Form.Item>

          <GridRow gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>状态</span>}
                field="status"
                initialValue="active"
              >
                <Select 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                >
                  <Option value="active">启用</Option>
                  <Option value="inactive">禁用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>小程序登录</span>}
                field="miniAppLoginEnabled"
                initialValue={false}
              >
                <Select 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                >
                  <Option value="true">允许</Option>
                  <Option value="false">禁止</Option>
                </Select>
              </Form.Item>
            </Col>
          </GridRow>

          {/* 权限分配 */}
          <Form.Item
            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>权限分配</span>}
          >
            <Tabs defaultActiveTab="menu" style={{ marginTop: '8px' }}>
              <TabPane key="menu" title="菜单权限">
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px'
                }}>
                  <Tree
                    checkable
                    checkedKeys={selectedMenuPermissions.map(id => id.toString())}
                    onCheck={(checkedKeys) => {
                      setSelectedMenuPermissions((checkedKeys as string[]).map(key => parseInt(key)));
                    }}
                    treeData={buildTreeData(menuPermissions)}
                    fieldNames={{
                      key: 'key',
                      title: 'title',
                      children: 'children'
                    }}
                  />
                </div>
              </TabPane>
              <TabPane key="button" title="按钮权限">
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {buttonPermissions.map(permission => (
                      <Tag
                        key={permission.id}
                        checkable
                        checked={selectedButtonPermissions.includes(permission.id)}
                        onChange={(checked) => {
                          if (checked) {
                            setSelectedButtonPermissions([...selectedButtonPermissions, permission.id]);
                          } else {
                            setSelectedButtonPermissions(selectedButtonPermissions.filter(id => id !== permission.id));
                          }
                        }}
                        style={{ 
                          marginBottom: '4px',
                          borderRadius: '4px'
                        }}
                      >
                        {permission.permissionName}
                      </Tag>
                    ))}
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 