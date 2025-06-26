'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, Message, Card, Typography, Grid, Tooltip } from '@arco-design/web-react';
import { IconSearch, IconRefresh, IconPlus, IconEdit, IconDelete, IconEye, IconSettings } from '@arco-design/web-react/icon';

const { Title } = Typography;
const { Row, Col } = Grid;

// 客户数据类型 - 简化为图片中的字段
interface Customer {
  id: number;
  customerCode: string;  // 客户编号
  customerName: string;  // 客户名
  customerAddress: string; // 客户地址
  updateTime: string;    // 更新时间
  updateBy: string;      // 更新人
}

export default function CustomersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: true,
    showJumper: true,
    sizeCanChange: true,
  });

  // 搜索状态 - 简化为图片中的搜索字段
  const [searchForm] = Form.useForm();
  const [searchValues, setSearchValues] = useState({
    customerCode: '',    // 客户编号
    customerName: '',    // 客户名
    customerAddress: '', // 客户地址
  });

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [batchDeleteModalVisible, setBatchDeleteModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Customer | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  // 选中的行
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);

  // 获取客户列表
  const fetchCustomers = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.current.toString(),
        pageSize: pagination.pageSize.toString(),
        ...searchValues,
        ...params,
      });

      const response = await fetch(`http://localhost:3000/api/customers?${queryParams}`);
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          // 映射后端字段到简化的前端字段
          const mappedData = result.data.map((item: any) => ({
            id: item.id,
            customerCode: item.customerNumber,
            customerName: item.customerName,
            customerAddress: item.customerAddress,
            updateTime: item.updateTime || item.createTime,
            updateBy: item.updateBy || '系统',
          }));
          setData(mappedData);
          setTotal(result.total || mappedData.length);
          setPagination(prev => ({
            ...prev,
            total: result.total || mappedData.length,
          }));
        } else {
          Message.error(`获取数据失败: ${result.message || '未知错误'}`);
          setData([]);
        }
      } else {
        Message.error(`获取客户数据失败: ${response.status} ${response.statusText}`);
        setData([]);
      }
    } catch (error) {
      console.error('获取客户数据错误:', error);
      Message.error('连接服务器失败，请确认后端服务已启动');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setSearchValues({
      customerCode: values.customerCode || '',
      customerName: values.customerName || '',
      customerAddress: values.customerAddress || '',
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCustomers({ ...values, page: 1 });
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    const resetValues = { customerCode: '', customerName: '', customerAddress: '' };
    setSearchValues(resetValues);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCustomers({ ...resetValues, page: 1 });
  };

  // 新增
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑
  const handleEdit = (record: Customer) => {
    setEditingRecord(record);
    form.setFieldsValue({
      customerName: record.customerName,
      customerAddress: record.customerAddress,
    });
    setModalVisible(true);
  };

  // 删除
  const handleDelete = (record: Customer) => {
    setDeletingRecord(record);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!deletingRecord) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/customers/${deletingRecord.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        Message.success('删除成功');
        fetchCustomers();
        setDeleteModalVisible(false);
        setDeletingRecord(null);
      } else {
        Message.error('删除失败');
      }
    } catch (error) {
      Message.error('删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请选择要删除的客户');
      return;
    }
    setBatchDeleteModalVisible(true);
  };

  // 确认批量删除
  const confirmBatchDelete = async () => {
    try {
      const promises = selectedRowKeys.map(id => 
        fetch(`http://localhost:3000/api/customers/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      Message.success('批量删除成功');
      setSelectedRowKeys([]);
      setBatchDeleteModalVisible(false);
      fetchCustomers();
    } catch (error) {
      Message.error('批量删除失败');
    }
  };

  // 保存
  const handleSave = async () => {
    try {
      const values = await form.validate();
      setLoading(true);

      const url = editingRecord
        ? `http://localhost:3000/api/customers/${editingRecord.id}`
        : 'http://localhost:3000/api/customers';

      // 根据后端DTO结构构建请求数据
      const requestData = {
        customerName: values.customerName,
        customerAddress: values.customerAddress,
      };

      const response = await fetch(url, {
        method: editingRecord ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        Message.success(editingRecord ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchCustomers();
      } else {
        const error = await response.text();
        Message.error(`操作失败: ${error}`);
      }
    } catch (error) {
      console.error('保存失败:', error);
      Message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 分页变化
  const handleTableChange = (pagination: any) => {
    setPagination(prev => ({ ...prev, ...pagination }));
    fetchCustomers({ page: pagination.current, pageSize: pagination.pageSize });
  };

  // 格式化时间
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 表格列定义 - 根据图片简化
  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 80,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <span style={{ color: '#86909C', fontWeight: 500 }}>
          {(pagination.current - 1) * pagination.pageSize + index + 1}
        </span>
      ),
    },
    {
      title: '客户编号',
      dataIndex: 'customerCode',
      width: 150,
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: '#1D2129' }}>{text}</span>
      ),
    },
    {
      title: '客户名',
      dataIndex: 'customerName',
      width: 200,
      render: (text: string) => (
        <span style={{ color: '#1D2129' }}>{text}</span>
      ),
    },
    {
      title: '客户地址',
      dataIndex: 'customerAddress',
      flex: 1,
      render: (text: string) => (
        <Tooltip content={text}>
          <span style={{ color: '#1D2129' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      align: 'center' as const,
      render: (text: string) => (
        <span style={{ color: '#86909C' }}>{formatDateTime(text)}</span>
      ),
    },
    {
      title: '更新人',
      dataIndex: 'updateBy',
      width: 120,
      align: 'center' as const,
      render: (text: string) => (
        <span style={{ color: '#86909C' }}>{text}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: Customer) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="primary"
            status="danger"
            size="small"
            icon={<IconDelete />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: (string | number)[], selectedRows: Customer[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  return (
    <div style={{ padding: '16px', background: '#F5F6FA', minHeight: '100vh' }}>
      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <div style={{ marginBottom: 16 }}>
          <Title heading={6} style={{ margin: 0, color: '#1D2129' }}>搜索</Title>
        </div>
        <Form form={searchForm} layout="horizontal">
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="客户编号" field="customerCode" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                <Input placeholder="请输入客户编号" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="客户名" field="customerName" labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
                <Input placeholder="请输入客户名" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="客户地址" field="customerAddress" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                <Input placeholder="请输入客户地址" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Space>
                <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button icon={<IconRefresh />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 客户管理 */}
      <Card style={{ borderRadius: 8 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title heading={6} style={{ margin: 0, color: '#1D2129' }}>客户管理</Title>
          <Space>
            <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
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
            <Button icon={<IconRefresh />} onClick={() => fetchCustomers()}>
              刷新
            </Button>
            <Button icon={<IconSettings />}>
              列设置
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            sizeCanChange: true,
            pageSizeChangeResetCurrent: true,
          }}
          onChange={handleTableChange}
          rowSelection={rowSelection}
          rowKey="id"
          stripe
          border
          scroll={{ x: 1000 }}
          noDataElement={
            <div style={{ padding: '50px 0', textAlign: 'center', color: '#86909C' }}>
              暂无数据
            </div>
          }
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑客户' : '新增客户'}
        visible={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {editingRecord && (
            <Form.Item label="客户编号">
              <Input 
                value={editingRecord.customerCode} 
                disabled 
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </Form.Item>
          )}
          <Form.Item
            label="客户名"
            field="customerName"
            rules={[{ required: true, message: '请输入客户名' }]}
          >
            <Input placeholder="请输入客户名" />
          </Form.Item>
          <Form.Item
            label="客户地址"
            field="customerAddress"
            rules={[{ required: true, message: '请输入客户地址' }]}
          >
            <Input.TextArea 
              placeholder="请输入客户地址" 
              rows={3}
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
                  </Form>
        </Modal>

        {/* 删除确认模态框 */}
        <Modal
          title="确认删除"
          visible={deleteModalVisible}
          onOk={confirmDelete}
          onCancel={() => {
            setDeleteModalVisible(false);
            setDeletingRecord(null);
          }}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ status: 'danger' }}
        >
          <p>确定要删除客户 "{deletingRecord?.customerName}" 吗？</p>
          <p style={{ color: '#999', fontSize: '12px' }}>此操作不可撤销，请谨慎操作。</p>
        </Modal>

        {/* 批量删除确认模态框 */}
        <Modal
          title="确认批量删除"
          visible={batchDeleteModalVisible}
          onOk={confirmBatchDelete}
          onCancel={() => setBatchDeleteModalVisible(false)}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ status: 'danger' }}
        >
          <p>确定要删除选中的 {selectedRowKeys.length} 个客户吗？</p>
          <p style={{ color: '#999', fontSize: '12px' }}>此操作不可撤销，请谨慎操作。</p>
        </Modal>
      </div>
    );
  } 