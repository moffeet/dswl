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
  Tabs
} from '@arco-design/web-react';
import type { ColumnProps } from '@arco-design/web-react/lib/Table';
import { Grid } from '@arco-design/web-react';
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
const { Row, Col } = Grid;
const { TabPane } = Tabs;

// 角色数据接口
interface Role {
  id: number;
  roleName: string;
  roleId: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

interface Permission {
  id: number;
  permissionName: string;
  permissionCode: string;
  permissionType: 'menu' | 'button';
  parentId: number;
  children?: Permission[];
}

// 模拟角色数据
const mockRoles: Role[] = [
  {
    id: 1,
    roleName: '超级管理员',
    roleId: 'admin',
    description: '系统超级管理员，拥有所有权限',
    permissions: ['用户管理', '客户管理', '司机管理', '打卡记录', '数据统计'],
    userCount: 5,
    status: true,
    createdAt: '2024/01/20 10:30:00',
    updatedAt: '2024/01/25 14:20:00',
    updatedBy: '系统管理员'
  },
  {
    id: 2,
    roleName: '管理员',
    roleId: 'manager',
    description: '管理员，拥有系统管理和部分业务权限',
    permissions: ['客户查看', '打卡提交', '个人信息'],
    userCount: 15,
    status: true,
    createdAt: '2023/06/19 08:09:04',
    updatedAt: '2023/06/20 09:15:30',
    updatedBy: '管理员A'
  },
  {
    id: 3,
    roleName: '司机',
    roleId: 'driver',
    description: '司机角色，主要负责配送业务',
    permissions: ['客户查看', '打卡提交', '个人信息'],
    userCount: 8,
    status: true,
    createdAt: '2023/04/26 08:23:39',
    updatedAt: '2023/05/10 16:40:25',
    updatedBy: '管理员B'
  },
  {
    id: 4,
    roleName: '销售',
    roleId: 'sales',
    description: '销售角色，主要负责客户和订单管理',
    permissions: ['客户管理', '司机查看', '打卡查看'],
    userCount: 8,
    status: true,
    createdAt: '2023/04/26 08:23:39',
    updatedAt: '2023/05/10 16:40:25',
    updatedBy: '管理员B'
  },
];

// 备用权限数据
const fallbackMenuPermissions: Permission[] = [
  {
    id: 1,
    permissionName: '首页',
    permissionCode: 'menu.dashboard',
    permissionType: 'menu',
    parentId: 0
  },
  {
    id: 2,
    permissionName: '系统管理',
    permissionCode: 'menu.system',
    permissionType: 'menu',
    parentId: 0,
    children: [
      {
        id: 4,
        permissionName: '用户管理',
        permissionCode: 'menu.system.users',
        permissionType: 'menu',
        parentId: 2
      },
      {
        id: 5,
        permissionName: '角色管理',
        permissionCode: 'menu.system.roles',
        permissionType: 'menu',
        parentId: 2
      },
      {
        id: 6,
        permissionName: '权限管理',
        permissionCode: 'menu.system.permissions',
        permissionType: 'menu',
        parentId: 2
      }
    ]
  },
  {
    id: 3,
    permissionName: '业务管理',
    permissionCode: 'menu.business',
    permissionType: 'menu',
    parentId: 0,
    children: [
      {
        id: 7,
        permissionName: '客户管理',
        permissionCode: 'menu.business.customers',
        permissionType: 'menu',
        parentId: 3
      }
    ]
  }
];

const fallbackButtonPermissions: Permission[] = [
  {
    id: 101,
    permissionName: '用户新增',
    permissionCode: 'btn.user.add',
    permissionType: 'button',
    parentId: 0
  },
  {
    id: 102,
    permissionName: '用户编辑',
    permissionCode: 'btn.user.edit',
    permissionType: 'button',
    parentId: 0
  },
  {
    id: 103,
    permissionName: '用户删除',
    permissionCode: 'btn.user.delete',
    permissionType: 'button',
    parentId: 0
  },
  {
    id: 201,
    permissionName: '角色新增',
    permissionCode: 'btn.role.add',
    permissionType: 'button',
    parentId: 0
  },
  {
    id: 202,
    permissionName: '角色编辑',
    permissionCode: 'btn.role.edit',
    permissionType: 'button',
    parentId: 0
  },
  {
    id: 301,
    permissionName: '客户新增',
    permissionCode: 'btn.customer.add',
    permissionType: 'button',
    parentId: 0
  },
  {
    id: 302,
    permissionName: '客户编辑',
    permissionCode: 'btn.customer.edit',
    permissionType: 'button',
    parentId: 0
  }
];

// API调用函数
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
      return result.data || fallbackMenuPermissions;
    }
    return fallbackMenuPermissions;
  } catch (error) {
    console.error('获取菜单权限失败:', error);
    return fallbackMenuPermissions;
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
      return result.data || fallbackButtonPermissions;
    }
    return fallbackButtonPermissions;
  } catch (error) {
    console.error('获取按钮权限失败:', error);
    return fallbackButtonPermissions;
  }
};

// 所有可用权限
const allPermissions = [
  { value: 'user_manage', label: '用户管理', group: '系统管理' },
  { value: 'customer_manage', label: '客户管理', group: '业务管理' },
  { value: 'customer_view', label: '客户查看', group: '业务管理' },
  { value: 'driver_manage', label: '司机管理', group: '业务管理' },
  { value: 'driver_view', label: '司机查看', group: '业务管理' },
  { value: 'checkin_manage', label: '打卡记录', group: '业务管理' },
  { value: 'checkin_view', label: '打卡查看', group: '业务管理' },
  { value: 'checkin_submit', label: '打卡提交', group: '业务管理' },
  { value: 'statistics_view', label: '数据统计', group: '系统管理' },
  { value: 'profile_view', label: '个人信息', group: '基础权限' },
  { value: 'profile_edit', label: '个人信息编辑', group: '基础权限' },
];



// 状态选项
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' }
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>(mockRoles);
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

  // 权限相关状态
  const [menuPermissions, setMenuPermissions] = useState<Permission[]>([]);
  const [buttonPermissions, setButtonPermissions] = useState<Permission[]>([]);
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([]); // 默认不选中任何权限
  const [selectedButtonKeys, setSelectedButtonKeys] = useState<string[]>([]); // 默认不选中任何权限

  // 初始化权限数据
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const [menuData, buttonData] = await Promise.all([
          fetchMenuPermissions(),
          fetchButtonPermissions()
        ]);
        console.log('加载的菜单权限数据:', menuData);
        console.log('加载的按钮权限数据:', buttonData);
        setMenuPermissions(menuData);
        setButtonPermissions(buttonData);
      } catch (error) {
        console.error('加载权限数据失败:', error);
        Message.error('权限数据加载失败');
      }
    };
    
    loadPermissions();
  }, []);

  // 应用搜索和筛选
  useEffect(() => {
    let filtered = [...roles];

    // 关键字搜索
    if (searchKeyword) {
      filtered = filtered.filter(role => 
        role.roleName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        role.roleId.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        role.description.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    // 状态筛选
    if (selectedStatus) {
      filtered = filtered.filter(role => 
        selectedStatus === 'active' ? role.status : !role.status
      );
    }

    setFilteredRoles(filtered);
    setCurrentPage(1);
  }, [roles, searchKeyword, selectedStatus]);

  // 统计数据
  const stats = {
    total: roles.length,
    active: roles.filter(r => r.status).length,
    inactive: roles.filter(r => !r.status).length,
    totalUsers: roles.reduce((sum, role) => sum + role.userCount, 0)
  };

  // 表格列定义
  const columns: ColumnProps<Role>[] = [
    {
      title: '角色信息',
      dataIndex: 'roleName',
      key: 'roleName',
      width: 200,
      render: (text: string, record: Role) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {text.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
              {text}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {record.roleId}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '角色描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text: string) => (
        <div style={{ 
          fontSize: '14px', 
          color: '#475569',
          lineHeight: '1.4'
        }}>
          {text || '-'}
        </div>
      ),
    },
    {
      title: '用户数/状态',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 120,
      align: 'center',
      render: (count: number, record: Role) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            color: record.status ? '#10b981' : '#ef4444',
            marginBottom: '4px'
          }}>
            {count}
          </div>
          <Tag color={record.status ? 'green' : 'red'} style={{ 
            fontSize: '12px',
            borderRadius: '12px',
            padding: '2px 8px',
            border: 'none'
          }}>
            {record.status ? '启用中' : '已禁用'}
          </Tag>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => (
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          {text}
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (text: string) => (
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          {text}
        </div>
      ),
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      width: 120,
      render: (text: string) => (
        <Tag style={{ 
          borderRadius: '12px',
          fontSize: '12px',
          color: '#1e293b',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0'
        }}>
          {text || '当前用户'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (text: any, record: Role) => (
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

  // 处理搜索重置
  const handleReset = () => {
    setSearchKeyword('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  // 处理新增角色
  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setSelectedMenuKeys([]);
    setSelectedButtonKeys([]);
    setVisible(true);
  };

  // 处理编辑角色
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      ...role,
      permissions: role.permissions,
    });
    
    // 根据角色已有权限设置选中状态
    // 这里使用权限名称来映射，实际项目中应该从后端获取角色的权限ID列表
    const menuKeys: string[] = [];
    const buttonKeys: string[] = [];
    
    // 遍历菜单权限，根据权限名称匹配
    const findPermissionByName = (perms: Permission[], name: string): Permission | null => {
      for (const perm of perms) {
        if (perm.permissionName === name) return perm;
        if (perm.children) {
          const found = findPermissionByName(perm.children, name);
          if (found) return found;
        }
      }
      return null;
    };
    
    // 匹配菜单权限
    role.permissions.forEach(permName => {
      const menuPerm = findPermissionByName(menuPermissions, permName);
      if (menuPerm) {
        menuKeys.push(menuPerm.id.toString());
      }
      
      // 匹配按钮权限
      const buttonPerm = buttonPermissions.find(bp => bp.permissionName === permName);
      if (buttonPerm) {
        buttonKeys.push(buttonPerm.id.toString());
      }
    });
    
    setSelectedMenuKeys(menuKeys);
    setSelectedButtonKeys(buttonKeys);
    setVisible(true);
  };

  // 处理删除角色
  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRoles(roles.filter(r => r.id !== id));
      Message.success('删除成功');
    } catch (error) {
      Message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    // 检查是否选择了权限
    if (selectedMenuKeys.length === 0 && selectedButtonKeys.length === 0) {
      Message.warning('请至少选择一项权限！');
      return;
    }
    
    // 获取选中权限的名称
    const menuNames = selectedMenuKeys.map(key => {
      const findPermission = (perms: Permission[]): string | null => {
        for (const perm of perms) {
          if (perm.id.toString() === key) return perm.permissionName;
          if (perm.children) {
            const found = findPermission(perm.children);
            if (found) return found;
          }
        }
        return null;
      };
      return findPermission(menuPermissions);
    }).filter(Boolean);
    
    const buttonNames = selectedButtonKeys.map(key => {
      const perm = buttonPermissions.find(p => p.id.toString() === key);
      return perm ? perm.permissionName : null;
    }).filter(Boolean);
    
    // 创建确认内容
    const confirmContent = `
      角色名称：${values.roleName}
      角色编码：${values.roleId}
      角色描述：${values.description || '无'}
      
      菜单权限 (${menuNames.length}项)：${menuNames.join('、')}
      
      按钮权限 (${buttonNames.length}项)：${buttonNames.join('、')}
      
      确认要${editingRole ? '更新' : '创建'}此角色及其权限配置吗？此操作将影响该角色下的所有用户权限。
    `;

    // 使用原生confirm进行确认
    if (window.confirm(confirmContent)) {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (editingRole) {
          // 编辑
          const updatedRoles = roles.map(r => 
            r.id === editingRole.id ? { 
              ...r, 
              ...values,
              permissions: [...menuNames, ...buttonNames],
              updatedAt: new Date().toLocaleString(),
              updatedBy: '当前用户'
            } : r
          );
          setRoles(updatedRoles);
          Message.success('角色更新成功');
        } else {
          // 新增
          const newRole: Role = {
            id: Date.now(),
            ...values,
            permissions: [...menuNames, ...buttonNames],
            userCount: 0,
            status: true,
            createdAt: new Date().toLocaleString(),
            updatedAt: new Date().toLocaleString(),
            updatedBy: '当前用户'
          };
          setRoles([newRole, ...roles]);
          Message.success('角色创建成功');
        }
        
        setVisible(false);
        form.resetFields();
        setSelectedMenuKeys([]);
        setSelectedButtonKeys([]);
      } catch (error) {
        Message.error('保存失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const paginatedData = filteredRoles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 权限树数据转换
  const convertToTreeData = (permissions: Permission[]): any[] => {
    return permissions.map(permission => ({
      key: permission.id.toString(),
      title: permission.permissionName,
      children: permission.children ? convertToTreeData(permission.children) : undefined,
    }));
  };

  // 按钮权限数据转换
  const convertToButtonTreeData = (permissions: Permission[]): any[] => {
    // 按权限类型分组
    const grouped: { [key: string]: Permission[] } = {};
    permissions.forEach(permission => {
      const prefix = permission.permissionCode.split('.')[1]; // 如 'user', 'role', 'customer'
      if (!grouped[prefix]) {
        grouped[prefix] = [];
      }
      grouped[prefix].push(permission);
    });

    return Object.keys(grouped).map(key => ({
      key: `group_${key}`,
      title: `${key === 'user' ? '用户管理' : key === 'role' ? '角色管理' : key === 'customer' ? '客户管理' : key}`,
      children: grouped[key].map(permission => ({
        key: permission.id.toString(),
        title: permission.permissionName,
      })),
    }));
  };

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#f5f6fa', 
      minHeight: '100vh' 
    }}>
      {/* 统计卡片区域 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>总角色数</span>}
              value={stats.total}
              prefix={<IconSettings style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #48c9b0 0%, #158f89 100%)',
            border: 'none',
            color: 'white'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>启用角色</span>}
              value={stats.active}
              prefix={<IconCheckCircle style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            border: 'none',
            color: 'white'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>禁用角色</span>}
              value={stats.inactive}
              prefix={<IconLock style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #fd9644 0%, #f7931e 100%)',
            border: 'none',
            color: 'white'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>关联用户</span>}
              value={stats.totalUsers}
              prefix={<IconUser style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
      </Row>

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
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: '600',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <IconSearch style={{ color: '#3b82f6' }} />
              角色搜索
            </h3>
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <Input
              placeholder="请输入角色名称/ID"
              value={searchKeyword}
              onChange={setSearchKeyword}
              style={{ 
                width: '200px',
                borderRadius: '8px'
              }}
              prefix={<IconSearch />}
            />
            
            <Select
              placeholder="全部状态"
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
                type="primary"
                icon={<IconSearch />}
                style={{
                  height: '36px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}
              >
                搜索
              </Button>
              <Button 
                onClick={handleReset}
                icon={<IconRefresh />}
                style={{
                  height: '36px',
                  borderRadius: '6px'
                }}
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        {/* 标题和新增按钮 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <IconSettings style={{ color: '#3b82f6' }} />
              角色权限管理
            </h2>
            <p style={{ 
              margin: '4px 0 0 0', 
              color: '#64748b',
              fontSize: '14px'
            }}>
              管理系统角色和权限配置
            </p>
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
            total={filteredRoles.length}
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
        }}
        confirmLoading={loading}
        style={{
          borderRadius: '12px',
          width: '700px'
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
          <Row gutter={16}>
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
                label={<span style={{ fontSize: '14px', fontWeight: '500' }}>角色ID</span>}
                field="roleId"
                rules={[{ required: true, message: '请输入角色ID' }]}
              >
                <Input 
                  placeholder="请输入角色ID" 
                  style={{ 
                    borderRadius: '6px',
                    height: '36px'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>角色描述</span>}
            field="description"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <TextArea 
              placeholder="请输入角色描述" 
              rows={3} 
              style={{ 
                borderRadius: '6px'
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>权限配置</span>}
            field="permissions"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Tabs defaultActiveTab="menu">
              <TabPane key="menu" title="菜单权限">
                <div style={{ marginBottom: 8, fontSize: 14, color: '#86909C' }}>
                  选择角色可访问的菜单 (已加载 {menuPermissions.length} 个菜单权限)
                </div>
                {menuPermissions.length > 0 ? (
                  <Tree
                    checkable
                    checkedKeys={selectedMenuKeys}
                    onCheck={(checkedKeys) => {
                      const newMenuKeys = checkedKeys as string[];
                      setSelectedMenuKeys(newMenuKeys);
                      
                      // 自动选择相关的按钮权限
                      const autoSelectedButtonKeys = new Set<string>();
                      
                      newMenuKeys.forEach(menuKey => {
                        // 找到选中的菜单权限
                        const findMenuPermission = (perms: Permission[], key: string): Permission | null => {
                          for (const perm of perms) {
                            if (perm.id.toString() === key) return perm;
                            if (perm.children) {
                              const found = findMenuPermission(perm.children, key);
                              if (found) return found;
                            }
                          }
                          return null;
                        };
                        
                        const menuPerm = findMenuPermission(menuPermissions, menuKey);
                        if (menuPerm) {
                          // 根据菜单权限编码自动选择对应的按钮权限
                          let buttonPrefix = '';
                          if (menuPerm.permissionCode === 'menu.system.users') {
                            buttonPrefix = 'btn.user';
                          } else if (menuPerm.permissionCode === 'menu.system.roles') {
                            buttonPrefix = 'btn.role';
                          } else if (menuPerm.permissionCode === 'menu.business.customers') {
                            buttonPrefix = 'btn.customer';
                          }
                          
                          if (buttonPrefix) {
                            // 自动选择相关的按钮权限
                            buttonPermissions.forEach(btnPerm => {
                              if (btnPerm.permissionCode.startsWith(buttonPrefix)) {
                                autoSelectedButtonKeys.add(btnPerm.id.toString());
                              }
                            });
                          }
                        }
                      });
                      
                      // 合并手动选择的按钮权限和自动选择的按钮权限
                      const autoSelectedIds = Array.from(autoSelectedButtonKeys);
                      const manualButtonKeys = selectedButtonKeys.filter(key => {
                        // 保留不是自动分配的按钮权限
                        return !autoSelectedIds.includes(key);
                      });
                      
                      const finalButtonKeys = [...manualButtonKeys, ...Array.from(autoSelectedButtonKeys)];
                      setSelectedButtonKeys(finalButtonKeys);
                    }}
                    treeData={convertToTreeData(menuPermissions)}
                    style={{ 
                      border: '1px solid #E5E6EB', 
                      borderRadius: 6, 
                      padding: 12,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  />
                ) : (
                  <div style={{ 
                    border: '1px solid #E5E6EB', 
                    borderRadius: 6, 
                    padding: 20,
                    textAlign: 'center',
                    color: '#86909C'
                  }}>
                    正在加载菜单权限数据...
                  </div>
                )}
              </TabPane>
              <TabPane key="button" title="按钮权限">
                <div style={{ marginBottom: 8, fontSize: 14, color: '#86909C' }}>
                  选择角色可操作的按钮功能 (已加载 {buttonPermissions.length} 个按钮权限)
                </div>
                {buttonPermissions.length > 0 ? (
                  <Tree
                    checkable
                    checkedKeys={selectedButtonKeys}
                    onCheck={(checkedKeys) => setSelectedButtonKeys(checkedKeys as string[])}
                    treeData={convertToButtonTreeData(buttonPermissions)}
                    style={{ 
                      border: '1px solid #E5E6EB', 
                      borderRadius: 6, 
                      padding: 12,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  />
                ) : (
                  <div style={{ 
                    border: '1px solid #E5E6EB', 
                    borderRadius: 6, 
                    padding: 20,
                    textAlign: 'center',
                    color: '#86909C'
                  }}>
                    正在加载按钮权限数据...
                  </div>
                )}
              </TabPane>
            </Tabs>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '14px', fontWeight: '500' }}>状态</span>}
            field="status"
            initialValue={true}
          >
            <Switch checkedText="启用" uncheckedText="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 