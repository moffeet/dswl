'use client';

import React, { useState, useEffect } from 'react';
import { Button, Table, Space, Modal, Form, Input, Select, Message, Popconfirm, Badge, Card, Tag, Tooltip, Radio } from '@arco-design/web-react';
import { Grid } from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconSearch, IconRefresh, IconUser, IconUserGroup, IconSettings, IconPhone, IconEmail, IconEye } from '@arco-design/web-react/icon';

const { Row, Col } = Grid;
const { Option } = Select;

// 类型定义
interface User {
  id: number;
  username: string;
  gender: 'male' | 'female';
  nickname: string;
  phone: string;
  email: string;
  status: 'normal' | 'disabled';
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
  updateBy?: string;
}

// 模拟数据
const mockUsers: User[] = [
  {
    id: 1,
    username: 'oNtNcSNcPE7Cjp',
    gender: 'female',
    nickname: 'Gary Davis',
    phone: '13826219412',
    email: 'j.tzowh@ibrtaj.la',
    status: 'disabled',
    createdAt: '2023-12-01 09:00:00',
    updatedAt: '2024-06-20 10:30:00',
    updateBy: '系统',
  },
  {
    id: 2,
    username: 'lOyBkFbLvr8',
    gender: 'female',
    nickname: 'Shirley Lewis',
    phone: '16632315344',
    email: 'l.dbep@fywhzf.ch',
    status: 'disabled',
    createdAt: '2023-12-02 10:15:00',
    updatedAt: '2024-06-20 14:20:00',
    updateBy: '管理员',
  },
  {
    id: 3,
    username: 'kjV6T1baYL3mpd',
    gender: 'male',
    nickname: 'John Lopez',
    phone: '15988978012',
    email: 'o.luhtcpys@hqqb.so',
    status: 'normal',
    createdAt: '2023-12-03 11:30:00',
    updatedAt: '2024-06-20 16:45:00',
    updateBy: '管理员',
  },
  {
    id: 4,
    username: 'sn1',
    gender: 'female',
    nickname: 'Jason Rodriguez',
    phone: '15589485011',
    email: 'm.tyeyt@ogmvf.py',
    status: 'normal',
    createdAt: '2023-12-05 14:20:00',
    updatedAt: '2024-06-19 18:30:00',
    updateBy: '管理员',
  },
  {
    id: 5,
    username: 'L6wtLwlI17iHPZ',
    gender: 'male',
    nickname: 'Carol Smith',
    phone: '16677325324',
    email: 's.dpjqx@vgs.ye',
    status: 'normal',
    createdAt: '2023-12-06 15:30:00',
    updatedAt: '2024-06-20 17:20:00',
    updateBy: '管理员',
  },
  {
    id: 6,
    username: 'uweGvhdUCsWtpk9',
    gender: 'male',
    nickname: 'Michael Rodriguez',
    phone: '13839483118',
    email: 'r.ebeb@qkt.va',
    status: 'disabled',
    createdAt: '2023-12-07 16:20:00',
    updatedAt: '2024-06-20 18:10:00',
    updateBy: '管理员',
  },
  {
    id: 7,
    username: 'enPNI3DwWU2f',
    gender: 'male',
    nickname: 'Donald Williams',
    phone: '17755280111',
    email: 'i.pund@myudkcsrjf.pf',
    status: 'normal',
    createdAt: '2023-12-08 17:10:00',
    updatedAt: '2024-06-20 19:30:00',
    updateBy: '管理员',
  },
  {
    id: 8,
    username: 'Pt7n3uqV',
    gender: 'female',
    nickname: 'Jessica Thomas',
    phone: '15227196366',
    email: 'h.ljd@imrkxuxw.gi',
    status: 'normal',
    createdAt: '2023-12-09 18:00:00',
    updatedAt: '2024-06-20 20:15:00',
    updateBy: '管理员',
  },
];

export default function UsersPage() {
  const [data, setData] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [searchValues, setSearchValues] = useState({
    usernameOrNickname: '',
    realName: '',
    userType: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: mockUsers.length,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);

  // 统计数据
  const stats = {
    total: data.length,
    admin: 1,
    driver: 2,
    sales: 1,
  };

  // 搜索
  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      let filteredData = mockUsers;
      
      if (searchValues.usernameOrNickname) {
        filteredData = filteredData.filter(user => 
          user.username.toLowerCase().includes(searchValues.usernameOrNickname.toLowerCase()) ||
          user.nickname.toLowerCase().includes(searchValues.usernameOrNickname.toLowerCase())
        );
      }
      
      if (searchValues.realName) {
        filteredData = filteredData.filter(user => 
          user.nickname.includes(searchValues.realName)
        );
      }
      
      if (searchValues.userType) {
        // 这里可以根据角色过滤
      }
      
      setData(filteredData);
      setPagination(prev => ({ ...prev, total: filteredData.length, current: 1 }));
      setLoading(false);
    }, 500);
  };

  // 重置搜索
  const handleReset = () => {
    const resetValues = { usernameOrNickname: '', realName: '', userType: '' };
    setSearchValues(resetValues);
    setData(mockUsers);
    setPagination(prev => ({ ...prev, current: 1, total: mockUsers.length }));
  };

  // 编辑
  const handleEdit = (record: User) => {
    setEditingRecord(record);
    form.setFieldsValue({
      username: record.username,
      gender: record.gender,
      nickname: record.nickname,
      phone: record.phone,
      email: record.email,
      status: record.status,
    });
    setModalVisible(true);
  };

  // 新增
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 保存
  const handleSave = async () => {
    try {
      const values = await form.validate();
      
      if (editingRecord) {
        // 编辑
        const updatedData = data.map(item => 
          item.id === editingRecord.id 
            ? { ...item, ...values, updatedAt: new Date().toLocaleString(), updateBy: '管理员' }
            : item
        );
        setData(updatedData);
        Message.success('用户更新成功！');
      } else {
        // 新增
        const newUser: User = {
          id: Date.now(),
          ...values,
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
          updateBy: '管理员',
        };
        setData([newUser, ...data]);
        Message.success('用户创建成功！');
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除
  const handleDelete = (record: User) => {
    const newData = data.filter(item => item.id !== record.id);
    setData(newData);
    setPagination(prev => ({ ...prev, total: newData.length }));
    Message.success('删除成功！');
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请选择要删除的用户');
      return;
    }
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个用户吗？`,
      onOk: () => {
        const newData = data.filter(item => !selectedRowKeys.includes(item.id));
        setData(newData);
        setSelectedRowKeys([]);
        setPagination(prev => ({ ...prev, total: newData.length }));
        Message.success('批量删除成功！');
      },
    });
  };

  // 表格选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: (string | number)[], selectedRows: User[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  // 分页变化
  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span style={{ fontWeight: 500 }}>
          {((pagination.current || 1) - 1) * (pagination.pageSize || 10) + index + 1}
        </span>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 180,
      render: (text: string) => (
        <span style={{ color: '#165DFF', fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      align: 'center' as const,
      render: (gender: string) => (
        <Tag color={gender === 'female' ? 'red' : 'blue'}>
          {gender === 'female' ? '女' : '男'}
        </Tag>
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 150,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '用户状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={status === 'normal' ? 'green' : 'orange'}>
          {status === 'normal' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此用户吗？"
            onOk={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="primary"
              status="danger"
              size="small"
              icon={<IconDelete />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f7f8fa', minHeight: '100vh' }}>
      {/* 统计卡片 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
                 <Col span={6}>
           <Card>
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: 14, color: '#86909C', marginBottom: 8 }}>总用户数</div>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                 <IconUser style={{ color: '#165DFF', fontSize: 20 }} />
                 <span style={{ color: '#165DFF', fontSize: 24, fontWeight: 600 }}>{stats.total}</span>
               </div>
             </div>
           </Card>
         </Col>
         <Col span={6}>
           <Card>
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: 14, color: '#86909C', marginBottom: 8 }}>管理员</div>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                 <IconSettings style={{ color: '#F53F3F', fontSize: 20 }} />
                 <span style={{ color: '#F53F3F', fontSize: 24, fontWeight: 600 }}>{stats.admin}</span>
               </div>
             </div>
           </Card>
         </Col>
         <Col span={6}>
           <Card>
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: 14, color: '#86909C', marginBottom: 8 }}>司机</div>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                 <IconUserGroup style={{ color: '#165DFF', fontSize: 20 }} />
                 <span style={{ color: '#165DFF', fontSize: 24, fontWeight: 600 }}>{stats.driver}</span>
               </div>
             </div>
           </Card>
         </Col>
         <Col span={6}>
           <Card>
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: 14, color: '#86909C', marginBottom: 8 }}>销售</div>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                 <IconUserGroup style={{ color: '#00B42A', fontSize: 20 }} />
                 <span style={{ color: '#00B42A', fontSize: 24, fontWeight: 600 }}>{stats.sales}</span>
               </div>
             </div>
           </Card>
         </Col>
      </Row>

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 500 }}>搜索</div>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>用户名/姓名</div>
            <Input
              placeholder="请输入用户名或姓名"
              value={searchValues.usernameOrNickname}
              onChange={(value) => setSearchValues(prev => ({ ...prev, usernameOrNickname: value }))}
              allowClear
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>真实姓名</div>
            <Input
              placeholder="请输入真实姓名"
              value={searchValues.realName}
              onChange={(value) => setSearchValues(prev => ({ ...prev, realName: value }))}
              allowClear
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>用户类型</div>
            <Select
              placeholder="请选择类型"
              style={{ width: '100%' }}
              value={searchValues.userType}
              onChange={(value) => setSearchValues(prev => ({ ...prev, userType: value }))}
              allowClear
            >
              <Option value="admin">管理员</Option>
              <Option value="driver">司机</Option>
              <Option value="sales">销售</Option>
            </Select>
          </Col>
          <Col span={6} style={{ display: 'flex', alignItems: 'end', gap: 12 }}>
            <Button
              type="primary"
              icon={<IconSearch />}
              onClick={handleSearch}
              loading={loading}
            >
              查询
            </Button>
            <Button
              icon={<IconRefresh />}
              onClick={handleReset}
            >
              重置
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 用户列表 */}
      <Card title="用户列表">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={handleAdd}
            >
              新增
            </Button>
            <Button
              type="primary"
              status="danger"
              icon={<IconDelete />}
              onClick={handleBatchDelete}
              disabled={selectedRowKeys.length === 0}
            >
              批量删除
            </Button>
            <Button
              icon={<IconRefresh />}
              onClick={handleReset}
            >
              刷新
            </Button>
          </Space>
          <Space>
            <Button icon={<IconSettings />}>列设置</Button>
          </Space>
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          data={data}
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total, range) => `共 ${total} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
            sizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑用户' : '新增用户'}
        visible={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="用户名"
            field="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="性别"
            field="gender"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Radio.Group>
              <Radio value="male">男</Radio>
              <Radio value="female">女</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="昵称"
            field="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
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
            label="邮箱"
            field="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="用户状态"
            field="status"
            rules={[{ required: true, message: '请选择用户状态' }]}
          >
            <Radio.Group>
              <Radio value="normal">启用</Radio>
              <Radio value="disabled">禁用</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 