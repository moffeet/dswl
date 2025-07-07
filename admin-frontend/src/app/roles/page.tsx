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
  IconUserGroup,
  IconMenuUnfold,
  IconCode
} from '@arco-design/web-react/icon';
import { API_ENDPOINTS } from '@/config/api';

const { TextArea } = Input;
const { Option } = Select;
const { Row: GridRow, Col } = Grid;

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
const fetchRoles = async (page: number = 1, limit: number = 10, searchParams?: any): Promise<{list: Role[], total: number}> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // 添加搜索参数
    if (searchParams?.roleName) params.append('roleName', searchParams.roleName);
    if (searchParams?.roleCode) params.append('roleCode', searchParams.roleCode);
    if (searchParams?.status) params.append('status', searchParams.status);
    if (searchParams?.miniAppLoginEnabled !== undefined) {
      params.append('miniAppLoginEnabled', searchParams.miniAppLoginEnabled.toString());
    }
    
    const response = await fetch(`${API_ENDPOINTS.roles}?${params.toString()}`, {
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
    const response = await fetch(`${API_ENDPOINTS.permissions}/menu-tree`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    const result = await response.json();
    return result.code === 200 ? result.data : [];
  } catch (error) {
    console.error('获取菜单权限失败:', error);
    return [];
  }
};

const fetchButtonPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.permissions}/button-tree`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    const result = await response.json();
    return result.code === 200 ? result.data : [];
  } catch (error) {
    console.error('获取按钮权限失败:', error);
    return [];
  }
};

const fetchCompletePermissions = async (): Promise<Permission[]> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.permissions}/complete-tree`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    const result = await response.json();
    return result.code === 200 ? result.data : [];
  } catch (error) {
    console.error('获取完整权限失败:', error);
    return [];
  }
};

// 新增：获取静态权限树
const fetchStaticPermissionTree = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.permissions}/static/tree`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    const result = await response.json();
    return result.code === 200 ? result.data : [];
  } catch (error) {
    console.error('获取静态权限树失败:', error);
    return [];
  }
};

const createRole = async (data: any): Promise<boolean> => {
  try {
    const response = await fetch(API_ENDPOINTS.roles, {
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
    const response = await fetch(`${API_ENDPOINTS.roles}/${id}`, {
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
    const response = await fetch(`${API_ENDPOINTS.roles}/${id}`, {
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

const assignPermissions = async (roleId: number, permissionCodes: string[]): Promise<boolean> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.roles}/${roleId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissionCodes }),
    });
    const result = await response.json();
    return result.code === 200;
  } catch (error) {
    console.error('分配权限失败:', error);
    return false;
  }
};



// 系统保护角色（不可删除和修改）
const PROTECTED_ROLES = ['admin', 'normal'];

export default function RolesPage() {
  const [data, setData] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [staticPermissionTree, setStaticPermissionTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 权限选择状态 - 改为权限代码数组
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 构造搜索参数
      const searchParams: any = {};
      if (searchKeyword) {
        searchParams.roleName = searchKeyword;
        searchParams.roleCode = searchKeyword;
      }
      if (selectedStatus) searchParams.status = selectedStatus;

      const [rolesData, permissionsData, staticTreeData] = await Promise.all([
        fetchRoles(currentPage, pageSize, searchParams),
        fetchCompletePermissions(),
        fetchStaticPermissionTree()
      ]);
      setData(rolesData.list);
      setTotal(rolesData.total);
      setAllPermissions(permissionsData);
      setStaticPermissionTree(staticTreeData);
    } catch (error) {
      Message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchKeyword, selectedStatus]);

  // 统计数据
  const stats = {
    total: total,
    active: data.filter(role => role.status === 'active').length,
    inactive: data.filter(role => role.status === 'inactive').length,
    miniApp: data.filter(role => role.miniAppLoginEnabled).length
  };

  // 构建权限树数据
  const buildTreeData = (permissions: Permission[]): any[] => {
    return permissions.map(permission => {
      const isMenuPermission = permission.permissionType === 'menu';
      const isButtonPermission = permission.permissionType === 'button';
      
      return {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isMenuPermission && (
              <IconMenuUnfold style={{ color: '#3b82f6', fontSize: '14px' }} />
            )}
            {isButtonPermission && (
              <IconCode style={{ color: '#10b981', fontSize: '14px' }} />
            )}
            <span style={{ 
              color: isButtonPermission ? '#10b981' : '#374151',
              fontWeight: isMenuPermission ? '500' : '400'
            }}>
              {permission.permissionName}
            </span>
            {isButtonPermission && (
              <span style={{ 
                color: '#9ca3af', 
                fontSize: '12px', 
                marginLeft: '4px' 
              }}>
                按钮
              </span>
            )}
        </div>
      ),
        key: permission.id.toString(),
        children: permission.children ? buildTreeData(permission.children) : undefined
      };
    });
  };

  // 构建静态权限树数据
  const buildStaticTreeData = (staticTree: any[]): any[] => {
    return staticTree.map(menu => ({
      key: menu.code,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconMenuUnfold style={{ color: '#3b82f6', fontSize: '14px' }} />
          <span style={{ color: '#374151', fontWeight: '500' }}>{menu.name}</span>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>({menu.path})</span>
        </div>
      ),
      children: menu.children ? menu.children.map((btn: any) => ({
        key: btn.code,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconCode style={{ color: '#10b981', fontSize: '14px' }} />
            <span style={{ color: '#10b981', fontWeight: '400' }}>{btn.name}</span>
          </div>
        )
      })) : []
    }));
  };

  // 递归获取所有权限ID（包括子权限）
  const getAllPermissionIds = (permissions: Permission[]): number[] => {
    let ids: number[] = [];
    permissions.forEach(permission => {
      ids.push(permission.id);
      if (permission.children && permission.children.length > 0) {
        ids = ids.concat(getAllPermissionIds(permission.children));
      }
    });
    return ids;
  };

  // 从树形数据中提取选中的权限ID
  const extractSelectedPermissions = (treeData: Permission[], selectedKeys: string[]): number[] => {
    let result: number[] = [];
    const traverse = (nodes: Permission[]) => {
      nodes.forEach(node => {
        if (selectedKeys.includes(node.id.toString())) {
          result.push(node.id);
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(treeData);
    return result;
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
      render: (_, record) => {
        const isProtected = PROTECTED_ROLES.includes(record.roleCode);

        return (
          <div className="flex gap-2 justify-center">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEdit(record)}
              className="text-blue-600 hover:text-blue-800"
              disabled={isProtected}
              title={isProtected ? '系统角色不允许编辑' : '编辑角色'}
            />
            <Popconfirm
              title={isProtected ? "系统角色不允许删除" : "确认删除此角色？"}
              onOk={() => !isProtected && handleDelete(record.id)}
              okText="确认"
              cancelText="取消"
              disabled={isProtected}
            >
              <Button
                type="text"
                size="small"
                icon={<IconDelete />}
                className={isProtected ? "text-gray-400" : "text-red-600 hover:text-red-800"}
                disabled={isProtected}
                title={isProtected ? '系统角色不允许删除' : '删除角色'}
              />
            </Popconfirm>
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
    setSelectedStatus('');
  };

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setSelectedPermissionCodes([]);
    setVisible(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      roleName: role.roleName,
      roleCode: role.roleCode,
      description: role.description
    });

    // 设置已选择的权限代码
    if (role.permissions && role.permissions.length > 0) {
      const permissionCodes = role.permissions.map(p => p.permissionCode);
      setSelectedPermissionCodes(permissionCodes);
    } else {
      setSelectedPermissionCodes([]);
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



  const handleSubmit = async (values: any) => {
    if (loading) return; // 防止重复提交

    setLoading(true);
    try {
      const roleData = {
        ...values,
        permissionCodes: selectedPermissionCodes
      };

      let success = false;
      if (editingRole) {
        // 编辑模式：调用更新角色接口，同时处理角色信息和权限
        success = await updateRole(editingRole.id, roleData);
      } else {
        // 新增模式：创建角色
        success = await createRole(roleData);
      }

      if (success) {
        Message.success(editingRole ? '更新成功' : '创建成功');
        setVisible(false);
        form.resetFields();
        setSelectedPermissionCodes([]);
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
        onOk={() => {
          form.validate().then((values) => {
            handleSubmit(values);
          }).catch((error) => {
            console.log('表单验证失败:', error);
          });
        }}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
          setSelectedPermissionCodes([]);
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
                rules={[
                  { required: true, message: '请输入角色名称' },
                  {
                    validator: (value, callback) => {
                      if (value && data.some(role =>
                        role.roleName === value &&
                        (!editingRole || role.id !== editingRole.id)
                      )) {
                        callback('角色名称已存在');
                      } else {
                        callback();
                      }
                    }
                  }
                ]}
              >
                <Input
                  placeholder="请输入角色名称（必须唯一）"
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
                rules={[
                  { required: true, message: '请输入角色编码' },
                  {
                    validator: (value, callback) => {
                      if (value && data.some(role =>
                        role.roleCode === value &&
                        (!editingRole || role.id !== editingRole.id)
                      )) {
                        callback('角色编码已存在');
                      } else {
                        callback();
                      }
                    }
                  }
                ]}
                disabled={!!editingRole} // 编辑时不允许修改角色编码
              >
                <Input
                  placeholder="请输入角色编码（必须唯一）"
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



          {/* 权限分配 */}
          <Form.Item
            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>权限分配</span>}
          >
            <div style={{ marginTop: '8px' }}>
              <div style={{
                marginBottom: '12px',
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#64748b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconMenuUnfold style={{ color: '#3b82f6', fontSize: '12px' }} />
                    <span>菜单权限</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconCode style={{ color: '#10b981', fontSize: '12px' }} />
                    <span>按钮权限</span>
                  </div>
                </div>
              </div>
              <div style={{
                maxHeight: '400px',
                overflow: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <Tree
                  checkable
                  checkedKeys={selectedPermissionCodes}
                  onCheck={(checkedKeys) => {
                    setSelectedPermissionCodes(checkedKeys as string[]);
                  }}
                  treeData={buildStaticTreeData(staticPermissionTree)}
                  fieldNames={{
                    key: 'key',
                    title: 'title',
                    children: 'children'
                  }}
                />
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 