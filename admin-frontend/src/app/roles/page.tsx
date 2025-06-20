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
  Statistic
} from '@arco-design/web-react';
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
  IconCheckCircle
} from '@arco-design/web-react/icon';

const { TextArea } = Input;
const { Option } = Select;
const { Row, Col } = Grid;

// 角色数据接口
interface Role {
  id: number;
  roleName: string;
  roleId: string;
  environment: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

// 模拟角色数据
const mockRoles: Role[] = [
  {
    id: 1,
    roleName: '管理员',
    roleId: 'admin',
    environment: '生产环境',
    description: '系统管理员，拥有所有权限',
    permissions: ['用户管理', '客户管理', '司机管理', '打卡记录', '数据统计'],
    userCount: 5,
    status: true,
    createdAt: '2024/01/20 10:30:00',
    updatedAt: '2024/01/25 14:20:00',
    updatedBy: '系统管理员'
  },
  {
    id: 2,
    roleName: '司机',
    roleId: 'driver',
    environment: '生产环境',
    description: '配送司机，可以查看客户信息和提交打卡记录',
    permissions: ['客户查看', '打卡提交', '个人信息'],
    userCount: 15,
    status: true,
    createdAt: '2023/06/19 08:09:04',
    updatedAt: '2023/06/20 09:15:30',
    updatedBy: '管理员A'
  },
  {
    id: 3,
    roleName: '销售',
    roleId: 'sales',
    environment: '生产环境',
    description: '销售人员，可以管理客户信息',
    permissions: ['客户管理', '司机查看', '打卡查看'],
    userCount: 8,
    status: true,
    createdAt: '2023/04/26 08:23:39',
    updatedAt: '2023/05/10 16:40:25',
    updatedBy: '管理员B'
  },
];

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

// 环境选项
const environmentOptions = [
  { label: '全部环境', value: '' },
  { label: '生产环境', value: '生产环境' },
  { label: '测试环境', value: '测试环境' },
  { label: '开发环境', value: '开发环境' }
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
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

    // 环境筛选
    if (selectedEnvironment) {
      filtered = filtered.filter(role => role.environment === selectedEnvironment);
    }

    // 状态筛选
    if (selectedStatus) {
      filtered = filtered.filter(role => 
        selectedStatus === 'active' ? role.status : !role.status
      );
    }

    setFilteredRoles(filtered);
    setCurrentPage(1);
  }, [roles, searchKeyword, selectedEnvironment, selectedStatus]);

  // 统计数据
  const stats = {
    total: roles.length,
    active: roles.filter(r => r.status).length,
    inactive: roles.filter(r => !r.status).length,
    totalUsers: roles.reduce((sum, role) => sum + role.userCount, 0)
  };

  // 表格列定义
  const columns = [
    {
      title: '角色信息',
      key: 'roleInfo',
      width: 200,
      render: (_: any, record: Role) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ 
            fontSize: '15px', 
            fontWeight: '600', 
            color: '#1d2129',
            marginBottom: '4px'
          }}>
            {record.roleName}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#86909c',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <IconLock style={{ fontSize: '12px' }} />
            {record.roleId}
          </div>
        </div>
      ),
    },
    {
      title: '环境/权限',
      key: 'envPermissions',
      width: 280,
      render: (_: any, record: Role) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '6px' }}>
            <Badge 
              status="success" 
              text={record.environment}
              style={{ fontSize: '13px', color: '#00b42a' }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {record.permissions.slice(0, 3).map((perm, index) => (
              <Tag 
                key={index} 
                size="small" 
                color="arcoblue"
                style={{ 
                  fontSize: '12px',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                {perm}
              </Tag>
            ))}
            {record.permissions.length > 3 && (
              <Tag 
                size="small" 
                color="gray"
                style={{ 
                  fontSize: '12px',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                +{record.permissions.length - 3}
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '用户数/状态',
      key: 'userStatus',
      width: 120,
      render: (_: any, record: Role) => (
        <div style={{ 
          padding: '8px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: '#1890ff'
          }}>
            {record.userCount}
          </div>
          <div>
            <Tag 
              color={record.status ? 'green' : 'red'}
              style={{ 
                fontSize: '12px',
                borderRadius: '12px',
                padding: '2px 8px'
              }}
            >
              {record.status ? '启用中' : '已禁用'}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (createdAt: string) => (
        <div style={{ 
          fontSize: '13px',
          color: '#86909c'
        }}>
          {createdAt}
        </div>
      ),
    },
    {
      title: '更新时间',
      key: 'updateInfo',
      width: 140,
      render: (_: any, record: Role) => (
        <div>
          <div style={{ 
            fontSize: '13px',
            color: '#86909c'
          }}>
            {record.updatedAt}
          </div>
        </div>
      ),
    },
    {
      title: '更新人',
      key: 'updatedBy',
      width: 100,
      render: (_: any, record: Role) => (
        <div style={{ 
          fontSize: '13px',
          color: '#86909c'
        }}>
          {record.updatedBy || '--'}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Role) => (
        <Space size="small">
          <button
            onClick={() => handleEdit(record)}
            style={{
              width: '26px',
              height: '26px',
              border: 'none',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            title="编辑角色"
          >
            <IconEdit />
          </button>
          <Popconfirm
            title="确定要删除这个角色吗？"
            onOk={() => handleDelete(record.id)}
          >
            <button
              style={{
                width: '26px',
                height: '26px',
                border: 'none',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                boxShadow: '0 2px 4px rgba(240, 147, 251, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
              title="删除角色"
            >
              <IconDelete />
            </button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理搜索重置
  const handleReset = () => {
    setSearchKeyword('');
    setSelectedEnvironment('');
    setSelectedStatus('');
  };

  // 处理新增角色
  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setVisible(true);
  };

  // 处理编辑角色
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      ...role,
      permissions: role.permissions,
    });
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
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingRole) {
        // 编辑
        const updatedRoles = roles.map(r => 
          r.id === editingRole.id ? { 
            ...r, 
            ...values,
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
          environment: '生产环境',
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
    } catch (error) {
      Message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = filteredRoles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
            gap: '16px', 
            alignItems: 'flex-end',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#64748b',
                marginBottom: '6px'
              }}>
                角色名称/ID
              </label>
              <Input
                placeholder="请输入角色名称或ID"
                value={searchKeyword}
                onChange={setSearchKeyword}
                style={{
                  height: '36px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div style={{ minWidth: '140px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#64748b',
                marginBottom: '6px'
              }}>
                环境
              </label>
              <Select
                placeholder="选择环境"
                value={selectedEnvironment}
                onChange={setSelectedEnvironment}
                style={{ 
                  width: '100%',
                  height: '36px'
                }}
                triggerProps={{
                  style: {
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }
                }}
              >
                {environmentOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: option.value === '生产环境' ? '#10b981' : 
                                       option.value === '测试环境' ? '#f59e0b' : 
                                       option.value === '开发环境' ? '#3b82f6' : '#6b7280'
                      }}></div>
                      {option.label}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
            
            <div style={{ minWidth: '120px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#64748b',
                marginBottom: '6px'
              }}>
                状态
              </label>
              <Select
                placeholder="选择状态"
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ 
                  width: '100%',
                  height: '36px'
                }}
                triggerProps={{
                  style: {
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }
                }}
              >
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: option.value === 'active' ? '#10b981' : 
                                       option.value === 'inactive' ? '#ef4444' : '#6b7280'
                      }}></div>
                      {option.label}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
            
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
            <Select
              placeholder="请选择权限"
              mode="multiple"
              maxTagCount={10}
              style={{ width: '100%' }}
              triggerProps={{
                style: {
                  borderRadius: '6px'
                }
              }}
            >
              {Object.entries(
                allPermissions.reduce((groups, perm) => {
                  if (!groups[perm.group]) {
                    groups[perm.group] = [];
                  }
                  groups[perm.group].push(perm);
                  return groups;
                }, {} as Record<string, typeof allPermissions>)
              ).map(([groupName, permissions]) => (
                <Select.OptGroup key={groupName} label={groupName}>
                  {permissions.map(perm => (
                    <Option key={perm.value} value={perm.value}>
                      {perm.label}
                    </Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
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