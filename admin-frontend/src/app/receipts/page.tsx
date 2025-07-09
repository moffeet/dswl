'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  DatePicker,
  Message,
  Modal,
  Image,
  Tag,
  Tooltip,
  Card,
  Grid,
  Statistic,
  Typography
} from '@arco-design/web-react';
import {
  IconSearch,
  IconDelete,
  IconEye,
  IconRefresh,
  IconCalendar,
  IconUser,
  IconLocation,
  IconCamera
} from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import dayjs from 'dayjs';
import PagePermissionGuard from '../components/PagePermissionGuard';

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Row, Col } = Grid;
const { Title } = Typography;

interface Receipt {
  id: number;
  wxUserId: number;
  wxUserName: string;
  customerId?: number;
  customerName: string;
  customerAddress?: string;
  uploadLocation?: string;
  uploadLongitude?: number;
  uploadLatitude?: number;
  imagePath: string;
  imageUrl: string;
  uploadTime: string;
  createTime: string;
  updateTime: string;
}

interface ReceiptQueryParams {
  page: number;
  limit: number;
  search?: string;
  customerName?: string;
  startTime?: string;
  endTime?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

const ReceiptsPage: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // 获取签收单列表
  const fetchReceipts = async (params?: Partial<ReceiptQueryParams>) => {
    setLoading(true);
    try {
      const queryParams: ReceiptQueryParams = {
        page: currentPage,
        limit: pageSize,
        search: searchText,
        customerName: customerSearchText,
        sortBy: 'uploadTime',
        sortOrder: 'DESC',
        ...params
      };

      if (dateRange) {
        queryParams.startTime = dateRange[0].toISOString();
        queryParams.endTime = dateRange[1].toISOString();
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/receipts?' + new URLSearchParams(
        Object.entries(queryParams).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.code === 200) {
        setReceipts(result.data.list);
        setTotal(result.data.total);
      } else {
        Message.error(result.message || '获取签收单列表失败');
      }
    } catch (error) {
      console.error('获取签收单列表失败:', error);
      Message.error('获取签收单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除签收单
  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/receipts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.code === 200) {
        Message.success('删除成功');
        fetchReceipts();
      } else {
        Message.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除签收单失败:', error);
      Message.error('删除失败');
    }
  };

  // 清理旧数据
  const handleCleanup = async () => {
    const confirmed = window.confirm('确定要清理3个月前的签收单数据吗？此操作不可恢复！');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/receipts/cleanup/old', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.code === 200) {
        Message.success(result.message);
        fetchReceipts();
      } else {
        Message.error(result.message || '清理失败');
      }
    } catch (error) {
      console.error('清理失败:', error);
      Message.error('清理失败');
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    fetchReceipts({ page: 1 });
  };

  // 重置搜索
  const handleReset = () => {
    setSearchText('');
    setCustomerSearchText('');
    setDateRange(null);
    setCurrentPage(1);
    fetchReceipts({ 
      page: 1, 
      search: '', 
      customerName: '', 
      startTime: undefined, 
      endTime: undefined 
    });
  };

  // 预览图片
  const handlePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
    setPreviewVisible(true);
  };

  // 表格列定义
  const columns: ColumnProps[] = [
    {
      title: '上传人',
      dataIndex: 'wxUserName',
      key: 'wxUserName',
      width: 100,
      render: (text: string) => (
        <Space>
          <IconUser />
          {text}
        </Space>
      ),
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '客户地址',
      dataIndex: 'customerAddress',
      key: 'customerAddress',
      width: 200,
      ellipsis: true,
      render: (text: string) => text ? (
        <Tooltip content={text}>
          <Space>
            <IconLocation />
            {text}
          </Space>
        </Tooltip>
      ) : '-',
    },
    {
      title: '上传地点',
      dataIndex: 'uploadLocation',
      key: 'uploadLocation',
      width: 200,
      ellipsis: true,
      render: (text: string) => text ? (
        <Tooltip content={text}>
          {text}
        </Tooltip>
      ) : '-',
    },
    {
      title: '图片预览',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imageUrl: string, record: Receipt) => (
        <Button
          type="text"
          icon={<IconCamera />}
          onClick={() => handlePreview(imageUrl, `${record.wxUserName} - ${record.customerName}`)}
        >
          查看
        </Button>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      width: 160,
      render: (text: string) => (
        <Space>
          <IconCalendar />
          {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record: Receipt) => (
        <Space>
          <Button
            type="text"
            status="danger"
            icon={<IconDelete />}
            onClick={() => {
              const confirmed = window.confirm('确定要删除这条签收单吗？');
              if (confirmed) {
                handleDelete(record.id);
              }
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];



  useEffect(() => {
    fetchReceipts();
  }, [currentPage, pageSize]);

  return (
    <PagePermissionGuard requiredPermission="menu.receipts">
      <div style={{ padding: '24px' }}>
        <Card>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic
                title="总签收单数"
                value={total}
                prefix={<IconCamera />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="今日上传"
                value={receipts.filter(r => dayjs(r.uploadTime).isSame(dayjs(), 'day')).length}
                prefix={<IconCalendar />}
              />
            </Col>
          </Row>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Space style={{ marginBottom: 16 }} wrap>
            <Search
              placeholder="搜索上传人"
              value={searchText}
              onChange={(value) => setSearchText(value)}
              onSearch={handleSearch}
              style={{ width: 200 }}
            />
            <Search
              placeholder="搜索客户名称"
              value={customerSearchText}
              onChange={(value) => setCustomerSearchText(value)}
              onSearch={handleSearch}
              style={{ width: 200 }}
            />
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              placeholder={['开始时间', '结束时间']}
            />
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<IconRefresh />} onClick={handleReset}>
              重置
            </Button>
            <Button
              type="dashed"
              icon={<IconDelete />}
              onClick={handleCleanup}
            >
              清理旧数据
            </Button>
          </Space>

          <Table
            columns={columns}
            data={receipts}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              sizeCanChange: true,
              showJumper: true,
              showTotal: true,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              },
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* 图片预览模态框 */}
        <Modal
          visible={previewVisible}
          title={previewTitle}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          style={{ width: 800 }}
        >
          <Image
            alt="签收单图片"
            style={{ width: '100%' }}
            src={previewImage}
          />
        </Modal>
      </div>
    </PagePermissionGuard>
  );
};

export default ReceiptsPage;
