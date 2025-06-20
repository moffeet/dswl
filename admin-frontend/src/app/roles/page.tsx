'use client';

import React, { useState } from 'react';
import { Button, Table, Space, Modal, Form, Input, Select, Message, Popconfirm, Badge, Card, Tag, Switch } from '@arco-design/web-react';
import { Grid } from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconSearch, IconRefresh, IconSettings } from '@arco-design/web-react/icon';

const { Row, Col } = Grid;
const { Option } = Select;
const { TextArea } = Input;

// 模拟角色数据
const mockRoles = [
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

export default function RolesPage() {
  const [roles, setRoles] = useState(mockRoles);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
      width: 120,
    },
    {
      title: '角色ID',
      dataIndex: 'roleId',
      key: 'roleId',
      width: 100,
      render: (roleId: any) => (
        <Tag color="blue">{roleId}</Tag>
      ),
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      width: 100,
      render: () => (
        <Badge status="success" text="生产环境" />
      ),
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 250,
      render: (permissions: any) => (
        <div>
          {permissions.slice(0, 3).map((perm: any, index: any) => (
            <Tag key={index} size="small" style={{ marginBottom: '2px' }}>
              {perm}
            </Tag>
          ))}
          {permissions.length > 3 && (
            <Tag size="small" style={{ marginBottom: '2px' }}>
              +{permissions.length - 3}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 80,
      render: (count: any) => (
        <span style={{ color: '#1890ff' }}>{count}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: any) => (
        <Switch checked={status} size="small" disabled />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
    },
    {
      title: '修改时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            修改
          </Button>
          <Popconfirm
            title="确定要删除这个角色吗？"
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
    setEditingRole(null);
    form.resetFields();
    setVisible(true);
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    form.setFieldsValue({
      ...role,
      permissions: role.permissions, // 这里需要转换为权限值数组
    });
    setVisible(true);
  };

  const handleDelete = async (id: any) => {
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
          } : r
        );
        setRoles(updatedRoles);
        Message.success('角色更新成功');
      } else {
        // 新增
        const newRole = {
          id: Date.now(),
          ...values,
          environment: '生产环境',
          userCount: 0,
          status: true,
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <IconSettings style={{ marginRight: '8px' }} />
              角色列表
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              管理系统角色和权限配置
            </p>
          </div>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
            新增角色
          </Button>
        </div>

        <Table
          columns={columns}
          data={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            current: 1,
            pageSize: 10,
            total: roles.length,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* 新建/编辑角色弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        visible={visible}
        onOk={form.submit}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色名称"
                field="roleName"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="角色ID"
                field="roleId"
                rules={[{ required: true, message: '请输入角色ID' }]}
              >
                <Input placeholder="请输入角色ID" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="角色描述"
            field="description"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>

          <Form.Item
            label="权限配置"
            field="permissions"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select
              placeholder="请选择权限"
              mode="multiple"
              maxTagCount={10}
              style={{ width: '100%' }}
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
            label="状态"
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