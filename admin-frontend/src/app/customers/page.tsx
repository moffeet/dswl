'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Form, Select, Message, Card, Typography, Grid, Tooltip, Descriptions } from '@arco-design/web-react';
import { IconSearch, IconRefresh, IconPlus, IconEdit, IconEye, IconUser, IconPhone, IconLocation } from '@arco-design/web-react/icon';

const { Title } = Typography;
const { Row, Col } = Grid;

// 客户数据类型
interface Customer {
  id: number;
  customerCode: string;
  customerName: string;
  contactPerson: string;
  phone: string;
  address: string;
  area: string;
  updateTime: string;
  updateBy: string;
  enabled: number;
}

// 区域颜色映射
const getAreaTagColor = (area: string) => {
  const colorMap: { [key: string]: string } = {
    '宝鸡保税': 'orange',
    '西安': 'blue',
    '福建保税': 'red',
    '华北': 'green',
    '华东': 'cyan',
    '华南': 'purple',
    '广州保税': 'green',
    '深圳': 'cyan',
    '东莞保税': 'purple',
    '佛山': 'lime',
    '中山': 'gold'
  };
  return colorMap[area] || 'gray';
};

export default function CustomersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
    showTotal: true,
    showJumper: true,
    sizeCanChange: true,
  });

  // 搜索状态
  const [searchForm] = Form.useForm();
  const [searchValues, setSearchValues] = useState({
    customerCode: '',
    customerName: '',
    area: '',
  });

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Customer | null>(null);
  const [form] = Form.useForm();

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
          // 映射后端字段到前端期望的字段
          const mappedData = result.data.map((item: any) => ({
            id: item.id,
            customerCode: item.customerNumber,
            customerName: item.customerName,
            contactPerson: item.contactPerson,
            phone: item.contactPhone,
            address: item.customerAddress,
            area: item.area,
            updateTime: item.updateTime || item.createTime,
            updateBy: item.updateBy || '系统',
            enabled: item.status,
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
      area: values.area || '',
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCustomers({ ...values, page: 1 });
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    const resetValues = { customerCode: '', customerName: '', area: '' };
    setSearchValues(resetValues);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCustomers({ ...resetValues, page: 1 });
  };

  // 查看详情
  const handleView = (record: Customer) => {
    setEditingRecord(record);
    setViewModalVisible(true);
  };

  // 编辑
  const handleEdit = (record: Customer) => {
    setEditingRecord(record);
    form.setFieldsValue({
      customerName: record.customerName,
      contactPerson: record.contactPerson,
      contactPhone: record.phone,
      customerAddress: record.address,
      area: record.area,
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
      setLoading(true);

      const url = editingRecord
        ? `http://localhost:3000/api/customers/${editingRecord.id}`
        : 'http://localhost:3000/api/customers';

      const response = await fetch(url, {
        method: editingRecord ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 表格列定义 - 优化布局，减少列数
  const columns = [
    {
      title: '客户编号',
      dataIndex: 'customerCode',
      key: 'customerCode',
      width: 120,
      fixed: 'left' as const,
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: '#165DFF', fontSize: 16, lineHeight: 1.4 }}>{text}</span>
      ),
    },
    {
      title: '客户信息',
      key: 'customerInfo',
      width: 320,
      render: (_: any, record: Customer) => (
        <div style={{ lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#1D2129' }}>
            {record.customerName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13, color: '#86909C' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 'fit-content' }}>
              <IconUser style={{ fontSize: 13 }} />
              {record.contactPerson}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 'fit-content' }}>
              <IconPhone style={{ fontSize: 13 }} />
              {record.phone}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: '区域地址',
      key: 'location',
      flex: 1,
      minWidth: 250,
      render: (_: any, record: Customer) => (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Tag 
              color={getAreaTagColor(record.area)} 
              style={{ 
                borderRadius: 6, 
                fontSize: 13,
                fontWeight: 500,
                padding: '4px 10px',
                lineHeight: 1.2
              }}
            >
              {record.area}
            </Tag>
          </div>
          <div style={{ fontSize: 13, color: '#86909C', lineHeight: 1.5 }}>
            <Tooltip content={record.address}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                <IconLocation style={{ fontSize: 13, marginTop: 2, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {record.address}
                </span>
              </span>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: '更新时间',
      key: 'updateTime',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: Customer) => (
        <div style={{ fontSize: 13, textAlign: 'center', color: '#1D2129', fontWeight: 500 }}>
          {formatDateTime(record.updateTime)}
        </div>
      ),
    },
    {
      title: '更新人',
      key: 'updateBy',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: Customer) => (
        <div style={{ fontSize: 13, textAlign: 'center', color: '#86909C' }}>
          {record.updateBy}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Customer) => (
        <Space size={6}>
          <Tooltip content="查看详情">
            <Button
              type="primary"
              size="small"
              icon={<IconEye style={{ fontSize: 13 }} />}
              onClick={() => handleView(record)}
              style={{ 
                height: 26,
                minWidth: 26,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
              }}
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="primary"
              size="small"
              icon={<IconEdit style={{ fontSize: 13 }} />}
              onClick={() => handleEdit(record)}
              style={{ 
                height: 26,
                minWidth: 26,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(245, 87, 108, 0.3)'
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

      return (
    <div style={{ 
      padding: '16px',
      background: '#F7F8FA',
      minHeight: '100vh'
    }}>
      {/* 搜索区域 */}
      <Card 
        style={{ 
          marginBottom: 16,
          borderRadius: 12,
          border: '1px solid #E5E6EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ padding: '20px' }}>
          <Row gutter={[16, 12]} align="center">
            <Col span={5}>
              <div>
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 500, 
                  color: '#4E5969',
                  marginBottom: 6,
                  display: 'block'
                }}>
                  客户编号
                </span>
                <Input 
                  placeholder="请输入客户编号" 
                  value={searchValues.customerCode}
                  onChange={(value) => setSearchValues(prev => ({ ...prev, customerCode: value }))}
                  style={{ 
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid #E5E6EB',
                    fontSize: 14
                  }}
                  prefix={<IconSearch style={{ color: '#86909C', fontSize: 14 }} />}
                />
              </div>
            </Col>
            <Col span={5}>
              <div>
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 500, 
                  color: '#4E5969',
                  marginBottom: 6,
                  display: 'block'
                }}>
                  客户名称
                </span>
                <Input 
                  placeholder="请输入客户名称" 
                  value={searchValues.customerName}
                  onChange={(value) => setSearchValues(prev => ({ ...prev, customerName: value }))}
                  style={{ 
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid #E5E6EB',
                    fontSize: 14
                  }}
                />
              </div>
            </Col>
            <Col span={4}>
              <div>
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 500, 
                  color: '#4E5969',
                  marginBottom: 6,
                  display: 'block'
                }}>
                  客户地址
                </span>
                <Select 
                  placeholder="请选择区域" 
                  value={searchValues.area || undefined}
                  onChange={(value) => setSearchValues(prev => ({ ...prev, area: value || '' }))}
                  allowClear
                  style={{ 
                    height: 36,
                    width: '100%'
                  }}
                  dropdownMenuStyle={{
                    borderRadius: 8,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    border: '1px solid #E5E6EB'
                  }}
                >
                  <Select.Option value="宝鸡保税">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FF6B35' }}></div>
                      宝鸡保税
                    </div>
                  </Select.Option>
                  <Select.Option value="西安">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3370FF' }}></div>
                      西安
                    </div>
                  </Select.Option>
                  <Select.Option value="福建保税">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#F53F3F' }}></div>
                      福建保税
                    </div>
                  </Select.Option>
                  <Select.Option value="华北">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00B42A' }}></div>
                      华北
                    </div>
                  </Select.Option>
                  <Select.Option value="华东">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00D4AA' }}></div>
                      华东
                    </div>
                  </Select.Option>
                  <Select.Option value="华南">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#722ED1' }}></div>
                      华南
                    </div>
                  </Select.Option>
                </Select>
              </div>
            </Col>
            <Col span={10}>
              <div style={{ marginTop: 26, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button 
                  type="primary" 
                  onClick={handleSearch}
                  icon={<IconSearch />}
                  style={{ 
                    height: 36,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #3370FF 0%, #4A9EFF 100%)',
                    border: 'none',
                    fontWeight: 500,
                    boxShadow: '0 2px 8px rgba(51, 112, 255, 0.25)',
                    minWidth: 88
                  }}
                >
                  查询
                </Button>
                <Button 
                  onClick={handleReset} 
                  icon={<IconRefresh />}
                  style={{ 
                    height: 36,
                    borderRadius: 6,
                    border: '1px solid #E5E6EB',
                    fontWeight: 500,
                    background: '#FFFFFF',
                    minWidth: 88
                  }}
                >
                  重置
                </Button>
                <Button 
                  type="primary" 
                  icon={<IconPlus />} 
                  onClick={handleAdd}
                  style={{ 
                    height: 36,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #00D4AA 0%, #00B894 100%)',
                    border: 'none',
                    fontWeight: 500,
                    boxShadow: '0 2px 8px rgba(0, 212, 170, 0.25)',
                    minWidth: 100
                  }}
                >
                  新增客户
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card 
        style={{ 
          borderRadius: 12,
          border: '1px solid #E5E6EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}
      >
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
          scroll={{ x: 1000 }}
          rowKey="id"
          stripe={false}
          border={{
            wrapper: false,
            cell: false,
          }}
          size="default"
          style={{
            borderRadius: 0,
          }}
          rowClassName={(record, index) => {
            return index % 2 === 0 ? 'table-row-even' : 'table-row-odd';
          }}
        />
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {editingRecord ? '编辑客户' : '新增客户'}
          </div>
        }
        visible={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        style={{ borderRadius: 8 }}
      >
        <div style={{ padding: '24px' }}>
          <Form form={form} layout="vertical" size="large">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="客户名称"
                field="customerName"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="联系人"
                field="contactPerson"
                rules={[{ required: true, message: '请输入联系人' }]}
              >
                <Input placeholder="请输入联系人" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="联系电话"
                field="contactPhone"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="所属区域"
                field="area"
                rules={[{ required: true, message: '请选择所属区域' }]}
              >
                <Select placeholder="请选择所属区域" style={{ borderRadius: 6 }}>
                  <Select.Option value="宝鸡保税">宝鸡保税</Select.Option>
                  <Select.Option value="西安">西安</Select.Option>
                  <Select.Option value="福建保税">福建保税</Select.Option>
                  <Select.Option value="华北">华北</Select.Option>
                  <Select.Option value="华东">华东</Select.Option>
                  <Select.Option value="华南">华南</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="详细地址"
                field="customerAddress"
                rules={[{ required: true, message: '请输入详细地址' }]}
              >
                <Input.TextArea 
                  placeholder="请输入详细地址" 
                  rows={3}
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Col>
                     </Row>
         </Form>
        </div>
       </Modal>

      {/* 查看详情模态框 */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            客户详情
          </div>
        }
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setViewModalVisible(false)}
            style={{ borderRadius: 6 }}
          >
            关闭
          </Button>,
        ]}
        style={{ borderRadius: 8 }}
      >
        <div style={{ padding: '24px' }}>
          {editingRecord && (
          <Descriptions
            data={[
              { label: '客户编号', value: editingRecord.customerCode },
              { label: '客户名称', value: editingRecord.customerName },
              { label: '联系人', value: editingRecord.contactPerson },
              { label: '联系电话', value: editingRecord.phone },
              { label: '详细地址', value: editingRecord.address },
              { 
                label: '所属区域', 
                value: (
                  <Tag color={getAreaTagColor(editingRecord.area)} style={{ borderRadius: 4 }}>
                    {editingRecord.area}
                  </Tag>
                )
              },
              { label: '更新时间', value: formatDateTime(editingRecord.updateTime) },
              { label: '更新人', value: editingRecord.updateBy },
            ]}
            column={2}
            layout="inline-vertical"
            labelStyle={{ fontWeight: 600 }}
                     />
         )}
        </div>
       </Modal>

      <style jsx global>{`
        .table-row-even {
          background-color: #FAFBFC !important;
        }
        .table-row-odd {
          background-color: #FFFFFF !important;
        }
        .table-row-even:hover,
        .table-row-odd:hover {
          background-color: #F0F8FF !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        .arco-table-thead > tr > th {
          background-color: #F7F8FA !important;
          border-bottom: 2px solid #E5E6EB !important;
          font-weight: 600 !important;
          color: #1D2129 !important;
          padding: 18px 16px !important;
          font-size: 14px !important;
          height: 56px !important;
        }
        .arco-table-tbody > tr > td {
          padding: 20px 16px !important;
          border-bottom: 1px solid #F2F3F5 !important;
          vertical-align: middle !important;
          height: 72px !important;
        }
        .arco-table {
          border-radius: 0 !important;
        }
        .arco-pagination {
          padding: 16px 24px !important;
          background-color: #FAFBFC !important;
          border-top: 1px solid #E5E6EB !important;
        }
        
        /* 美化下拉框样式 */
        .arco-select-view {
          border-radius: 6px !important;
          border: 1px solid #E5E6EB !important;
          transition: all 0.2s ease !important;
        }
        .arco-select-view:hover {
          border-color: #4A9EFF !important;
        }
        .arco-select-focused .arco-select-view {
          border-color: #3370FF !important;
          box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.1) !important;
        }
        .arco-select-option {
          padding: 8px 12px !important;
          border-radius: 4px !important;
          margin: 2px 4px !important;
          transition: all 0.2s ease !important;
        }
        .arco-select-option:hover {
          background-color: #F0F8FF !important;
        }
        .arco-select-option-selected {
          background-color: #E8F4FF !important;
          color: #3370FF !important;
          font-weight: 500 !important;
        }
        .arco-select-dropdown {
          border-radius: 8px !important;
          border: 1px solid #E5E6EB !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
          padding: 4px !important;
        }
        
        /* 优化输入框样式 */
        .arco-input {
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
        }
        .arco-input:hover {
          border-color: #4A9EFF !important;
        }
        .arco-input-focus {
          border-color: #3370FF !important;
          box-shadow: 0 0 0 2px rgba(51, 112, 255, 0.1) !important;
        }
        
        /* 优化操作按钮样式 */
        .arco-btn-primary {
          transition: all 0.2s ease !important;
        }
        .arco-btn-primary:hover {
          transform: translateY(-1px) scale(1.05) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
          filter: brightness(1.1) !important;
        }
        .arco-btn-primary:active {
          transform: translateY(0) scale(1) !important;
          transition: all 0.1s ease !important;
        }
      `}</style>
    </div>
  );
} 