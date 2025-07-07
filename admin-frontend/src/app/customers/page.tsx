'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Input, Space, Modal, Form, Message, Card, Typography, Grid, Tooltip, Select } from '@arco-design/web-react';
import { IconSearch, IconRefresh, IconPlus, IconEdit, IconDelete, IconEye, IconSettings } from '@arco-design/web-react/icon';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/api';
import { geocodeAddress, reverseGeocodeCoordinates } from '@/utils/amap';

const { Title } = Typography;
const { Row, Col } = Grid;

// 客户数据类型 - 扩展为新的地址管理字段
interface Customer {
  id: number;
  customerNumber: string;  // 客户编号
  customerName: string;    // 客户名

  storeAddress?: string;   // 门店地址
  warehouseAddress?: string; // 仓库地址
  storeLongitude?: number; // 门店经度
  storeLatitude?: number;  // 门店纬度
  warehouseLongitude?: number; // 仓库经度
  warehouseLatitude?: number;  // 仓库纬度
  status: 'active' | 'inactive'; // 状态
  lastSyncTime?: string;   // 最后同步时间
  updateTime: string;      // 更新时间
  updateBy: string;        // 更新人
}

// 地理编码响应类型
interface GeocodeResponse {
  address: string;
  longitude: number;
  latitude: number;
  province: string;
  city: string;
  district: string;
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

  // 防止重复请求的标志
  const initialLoadRef = useRef(false);

  // 搜索状态 - 只保留客户编号和客户名
  const [searchForm] = Form.useForm();
  const [searchValues, setSearchValues] = useState({
    customerNumber: '',    // 客户编号
    customerName: '',      // 客户名
  });

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [batchDeleteModalVisible, setBatchDeleteModalVisible] = useState(false);
  const [geocodeModalVisible, setGeocodeModalVisible] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Customer | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [geocodeForm] = Form.useForm();

  // 新增状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // 经纬度编辑状态
  const [storeCoordinatesEditable, setStoreCoordinatesEditable] = useState(false);
  const [warehouseCoordinatesEditable, setWarehouseCoordinatesEditable] = useState(false);

  // 获取认证头
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  };

  // 获取客户列表
  const fetchCustomers = async (params: any = {}) => {
    setLoading(true);
    try {
      // 构建查询参数，params优先级更高（用于搜索）
      const searchParams = {
        customerNumber: '', // 默认值
        customerName: '',
        ...params, // 覆盖默认值
      };

      const queryParams = new URLSearchParams({
        page: (params.page || pagination.current).toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchParams.customerNumber && { customerNumber: searchParams.customerNumber }),
        ...(searchParams.customerName && { customerName: searchParams.customerName }),
      });

      const response = await fetch(`${API_ENDPOINTS.customers}?${queryParams}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          // 映射后端字段到前端字段
          const mappedData = result.data.map((item: any) => ({
            id: item.id,
            customerNumber: item.customerNumber,
            customerName: item.customerName,
            storeAddress: item.storeAddress,
            warehouseAddress: item.warehouseAddress,
            storeLongitude: item.storeLongitude,
            storeLatitude: item.storeLatitude,
            warehouseLongitude: item.warehouseLongitude,
            warehouseLatitude: item.warehouseLatitude,
            status: item.status,
            lastSyncTime: item.lastSyncTime,
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
        // 如果是401错误，可能是token过期
        if (response.status === 401) {
          Message.error('登录已过期，请重新登录');
          // 跳转到登录页
          window.location.href = '/login';
          return;
        }
        
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
    // 防止React Strict Mode导致的重复请求
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchCustomers();
      fetchLastSyncTime();
    }
  }, []);

  // 搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    const searchParams = {
      customerNumber: values.customerNumber || '',
      customerName: values.customerName || '',
    };
    setSearchValues({
      customerNumber: values.customerNumber || '',
      customerName: values.customerName || '',
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCustomers({ ...searchParams, page: 1 });
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    const resetValues = {
      customerNumber: '',
      customerName: '',
    };
    setSearchValues(resetValues);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCustomers({ ...resetValues, page: 1 });
  };



  // 编辑
  const handleEdit = (record: Customer) => {
    setEditingRecord(record);
    form.setFieldsValue({
      storeAddress: record.storeAddress,
      warehouseAddress: record.warehouseAddress,
      storeLongitude: record.storeLongitude,
      storeLatitude: record.storeLatitude,
      warehouseLongitude: record.warehouseLongitude,
      warehouseLatitude: record.warehouseLatitude,
    });
    // 重置编辑状态
    setStoreCoordinatesEditable(false);
    setWarehouseCoordinatesEditable(false);
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
      const response = await fetch(`${API_ENDPOINTS.customers}/${deletingRecord.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        Message.success('删除成功');
        fetchCustomers();
        setDeleteModalVisible(false);
        setDeletingRecord(null);
      } else if (response.status === 401) {
        Message.error('登录已过期，请重新登录');
        window.location.href = '/login';
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
        fetch(`${API_ENDPOINTS.customers}/${id}`, { 
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
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

      if (!editingRecord) {
        Message.error('无法保存：未选择要编辑的客户');
        return;
      }

      const url = `${API_ENDPOINTS.customers}/${editingRecord.id}`;

      // 只保存地址相关字段
      const requestData = {
        storeAddress: values.storeAddress,
        warehouseAddress: values.warehouseAddress,
        storeLongitude: values.storeLongitude,
        storeLatitude: values.storeLatitude,
        warehouseLongitude: values.warehouseLongitude,
        warehouseLatitude: values.warehouseLatitude,
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        Message.success(editingRecord ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchCustomers();
      } else if (response.status === 401) {
        Message.error('登录已过期，请重新登录');
        window.location.href = '/login';
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
  const handleTableChange = (newPagination: any) => {
    // 检查是否真的有变化，避免重复请求
    const hasPageChange = newPagination.current !== pagination.current;
    const hasPageSizeChange = newPagination.pageSize !== pagination.pageSize;

    if (hasPageChange || hasPageSizeChange) {
      setPagination(prev => ({ ...prev, ...newPagination }));
      fetchCustomers({
        page: newPagination.current,
        pageSize: newPagination.pageSize,
        ...searchValues // 保持当前搜索条件
      });
    }
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

  // 地址管理
  const handleAddressManage = (record: Customer) => {
    setEditingRecord(record);
    geocodeForm.setFieldsValue({
      storeAddress: record.storeAddress || '',
      warehouseAddress: record.warehouseAddress || '',
      storeLongitude: record.storeLongitude || '',
      storeLatitude: record.storeLatitude || '',
      warehouseLongitude: record.warehouseLongitude || '',
      warehouseLatitude: record.warehouseLatitude || '',
    });
    // 重置编辑状态
    setStoreCoordinatesEditable(false);
    setWarehouseCoordinatesEditable(false);
    setGeocodeModalVisible(true);
  };

  // 地理编码：地址转经纬度（地址管理模态框中使用）
  const handleGeocode = async (addressType: 'store' | 'warehouse') => {
    try {
      setGeocodeLoading(true);
      const values = geocodeForm.getFieldsValue();
      const address = addressType === 'store' ? values.storeAddress : values.warehouseAddress;

      if (!address) {
        Message.warning('请先输入地址');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.customers}/geocode`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ address }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          const { longitude, latitude } = result.data;
          if (addressType === 'store') {
            geocodeForm.setFieldsValue({
              storeLongitude: longitude,
              storeLatitude: latitude,
            });
          } else {
            geocodeForm.setFieldsValue({
              warehouseLongitude: longitude,
              warehouseLatitude: latitude,
            });
          }
          Message.success('获取经纬度成功');
        } else {
          Message.error(result.message || '获取经纬度失败');
        }
      } else {
        Message.error(`获取经纬度失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('获取经纬度失败:', error);
      Message.error('获取经纬度失败');
    } finally {
      setGeocodeLoading(false);
    }
  };

  // 地理编码：地址转经纬度（新增/编辑模态框中使用）
  const handleGeocodeInModal = async (addressType: 'store' | 'warehouse') => {
    try {
      setGeocodeLoading(true);
      const values = form.getFieldsValue();
      const address = addressType === 'store' ? values.storeAddress : values.warehouseAddress;
      const addressField = addressType === 'store' ? 'storeAddress' : 'warehouseAddress';

      // 清除之前的错误信息
      form.setFields([{
        name: addressField,
        errors: []
      }]);

      if (!address) {
        form.setFields([{
          name: addressField,
          errors: ['请先输入地址']
        }]);
        return;
      }

      // 直接调用高德地图API
      const result = await geocodeAddress(address);

      if (addressType === 'store') {
        form.setFieldsValue({
          storeLongitude: result.longitude,
          storeLatitude: result.latitude,
        });
      } else {
        form.setFieldsValue({
          warehouseLongitude: result.longitude,
          warehouseLatitude: result.latitude,
        });
      }
      Message.success('获取经纬度成功');
    } catch (error) {
      console.error('获取经纬度失败:', error);
      const addressField = addressType === 'store' ? 'storeAddress' : 'warehouseAddress';
      const errorMessage = error instanceof Error ? error.message : '获取经纬度失败';
      form.setFields([{
        name: addressField,
        errors: [errorMessage]
      }]);
    } finally {
      setGeocodeLoading(false);
    }
  };

  // 逆地理编码：经纬度转地址（地址管理模态框中使用）
  const handleReverseGeocode = async (addressType: 'store' | 'warehouse') => {
    try {
      setGeocodeLoading(true);
      const values = geocodeForm.getFieldsValue();
      const longitude = addressType === 'store' ? values.storeLongitude : values.warehouseLongitude;
      const latitude = addressType === 'store' ? values.storeLatitude : values.warehouseLatitude;

      if (!longitude || !latitude) {
        Message.warning('请先输入经纬度');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.customers}/reverse-geocode`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ longitude, latitude }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          const { address } = result.data;
          if (addressType === 'store') {
            geocodeForm.setFieldsValue({
              storeAddress: address,
            });
          } else {
            geocodeForm.setFieldsValue({
              warehouseAddress: address,
            });
          }
          Message.success('获取地址成功');
        } else {
          Message.error(result.message || '获取地址失败');
        }
      } else {
        Message.error(`获取地址失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('获取地址失败:', error);
      Message.error('获取地址失败');
    } finally {
      setGeocodeLoading(false);
    }
  };

  // 逆地理编码：经纬度转地址（新增/编辑模态框中使用）
  const handleReverseGeocodeInModal = async (addressType: 'store' | 'warehouse') => {
    try {
      setGeocodeLoading(true);
      const values = form.getFieldsValue();
      const longitude = addressType === 'store' ? values.storeLongitude : values.warehouseLongitude;
      const latitude = addressType === 'store' ? values.storeLatitude : values.warehouseLatitude;
      const longitudeField = addressType === 'store' ? 'storeLongitude' : 'warehouseLongitude';
      const latitudeField = addressType === 'store' ? 'storeLatitude' : 'warehouseLatitude';

      // 清除之前的错误信息
      form.setFields([
        { name: longitudeField, errors: [] },
        { name: latitudeField, errors: [] }
      ]);

      if (!longitude || !latitude) {
        const errorMessage = '请先输入经纬度';
        form.setFields([
          { name: longitudeField, errors: !longitude ? [errorMessage] : [] },
          { name: latitudeField, errors: !latitude ? [errorMessage] : [] }
        ]);
        return;
      }

      // 直接调用高德地图API
      const result = await reverseGeocodeCoordinates(longitude, latitude);

      if (addressType === 'store') {
        form.setFieldsValue({
          storeAddress: result.address,
        });
      } else {
        form.setFieldsValue({
          warehouseAddress: result.address,
        });
      }
      Message.success('获取地址成功');
    } catch (error) {
      console.error('获取地址失败:', error);
      const longitudeField = addressType === 'store' ? 'storeLongitude' : 'warehouseLongitude';
      const errorMessage = error instanceof Error ? error.message : '获取地址失败';
      form.setFields([
        { name: longitudeField, errors: [errorMessage] }
      ]);
    } finally {
      setGeocodeLoading(false);
    }
  };

  // 保存地址信息
  const handleSaveAddress = async () => {
    try {
      const values = await geocodeForm.validate();
      setLoading(true);

      const response = await fetch(`${API_ENDPOINTS.customers}/${editingRecord?.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          Message.success('地址信息保存成功');
          setGeocodeModalVisible(false);
          fetchCustomers();
        } else {
          Message.error(result.message || '保存失败');
        }
      } else {
        Message.error(`保存失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('保存失败:', error);
      Message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 同步客户数据
  const handleSync = () => {
    setSyncModalVisible(true);
  };

  const handleConfirmSync = async () => {
    try {
      setSyncLoading(true);

      // 模拟外部系统数据（实际应用中这里应该调用外部系统API）
      const externalCustomers = [
        {
          customerNumber: 'EXT001',
          customerName: '外部系统客户1'
        },
        {
          customerNumber: 'EXT002',
          customerName: '外部系统客户2'
        },
        {
          customerNumber: 'C001', // 已存在的客户，只更新名称
          customerName: '深圳科技有限公司（已更新）'
        }
      ];

      const response = await fetch(`${API_ENDPOINTS.customers}/sync-external`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(externalCustomers),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          const { syncedCount, updatedCount, newCount } = result.data;
          Message.success(`同步成功！共处理 ${syncedCount} 个客户，更新 ${updatedCount} 个，新增 ${newCount} 个`);
          setSyncModalVisible(false);
          fetchCustomers();
          // 更新同步时间
          fetchLastSyncTime();
        } else {
          Message.error(result.message || '同步失败');
        }
      } else {
        Message.error(`同步失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('同步失败:', error);
      Message.error('同步失败');
    } finally {
      setSyncLoading(false);
    }
  };

  // 获取最后同步时间
  const fetchLastSyncTime = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.customers}/last-sync-time`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          setLastSyncTime(result.data.lastSyncTime);
        }
      }
    } catch (error) {
      console.error('获取同步时间失败:', error);
    }
  };

  // Excel导出
  const handleExport = async (exportSelected = false) => {
    try {
      setExportLoading(true);
      let url = '/customers/export';

      if (exportSelected && selectedRowKeys.length > 0) {
        url += `?customerIds=${selectedRowKeys.join(',')}`;
      }

      const response = await api.get(url, { responseType: 'blob' });

      // 创建下载链接
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `customers_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      Message.success('导出成功');
    } catch (error) {
      Message.error('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  // 表格列定义 - 扩展为地址管理字段
  const columns = [
    {
      title: '客户编号',
      dataIndex: 'customerNumber',
      width: 120,
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: '#1D2129', fontSize: '14px' }}>{text}</span>
      ),
    },
    {
      title: '客户名',
      dataIndex: 'customerName',
      width: 180,
      render: (text: string) => (
        <span style={{ color: '#1D2129', fontSize: '14px' }}>{text}</span>
      ),
    },
    {
      title: '门店地址',
      dataIndex: 'storeAddress',
      width: 200,
      render: (text: string) => (
        <Tooltip content={text || '未设置'}>
          <div style={{
            color: text ? '#1D2129' : '#86909C',
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>
            {text || '未设置'}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '仓库地址',
      dataIndex: 'warehouseAddress',
      width: 200,
      render: (text: string) => (
        <Tooltip content={text || '未设置'}>
          <div style={{
            color: text ? '#1D2129' : '#86909C',
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>
            {text || '未设置'}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      align: 'center' as const,
      render: (status: string) => (
        <span style={{
          color: status === 'active' ? '#00B42A' : '#F53F3F',
          fontSize: '13px',
          fontWeight: 500
        }}>
          {status === 'active' ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '更新人',
      dataIndex: 'updateBy',
      width: 100,
      align: 'center' as const,
      render: (text: string) => (
        <span style={{ color: '#86909C', fontSize: '13px' }}>{text}</span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 140,
      align: 'center' as const,
      render: (text: string) => (
        <span style={{ color: '#86909C', fontSize: '13px' }}>{formatDateTime(text)}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: Customer) => (
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
            style={{ fontSize: '12px' }}
          >
            编辑
          </Button>
          <Button
            type="primary"
            status="danger"
            size="small"
            icon={<IconDelete />}
            onClick={() => handleDelete(record)}
            style={{ fontSize: '12px' }}
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
    <div style={{ padding: '20px', background: '#F5F6FA', minHeight: '100vh' }}>
      {/* 搜索区域 */}
      <Card style={{ 
        marginBottom: 20, 
        borderRadius: 8, 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: 'none'
      }}>
        <div style={{ marginBottom: 20 }}>
          <Title heading={6} style={{ margin: 0, color: '#1D2129', fontSize: '16px' }}>搜索</Title>
        </div>
        <Form form={searchForm} layout="horizontal">
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="客户编号" field="customerNumber" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                <Input
                  placeholder="请输入客户编号"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="客户名" field="customerName" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                <Input
                  placeholder="请输入客户名"
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Space size={8}>
                <Button
                  type="primary"
                  icon={<IconSearch />}
                  onClick={handleSearch}
                  style={{ borderRadius: 6 }}
                  size="small"
                >
                  搜索
                </Button>
                <Button
                  icon={<IconRefresh />}
                  onClick={handleReset}
                  style={{ borderRadius: 6 }}
                  size="small"
                >
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 客户管理 */}
      <Card style={{ 
        borderRadius: 8, 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: 'none'
      }}>
        <div style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Title heading={6} style={{ margin: 0, color: '#1D2129', fontSize: '16px' }}>客户地址管理</Title>
            {lastSyncTime && (
              <div style={{ marginTop: 4, color: '#86909C', fontSize: '12px' }}>
                上次同步时间：{formatDateTime(lastSyncTime)}
              </div>
            )}
          </div>
          <Space size={12}>
            <Button
              type="primary"
              icon={<IconRefresh />}
              onClick={handleSync}
              loading={syncLoading}
              style={{ borderRadius: 6 }}
            >
              同步
            </Button>
            <Button
              type="primary"
              status="danger"
              icon={<IconDelete />}
              onClick={handleBatchDelete}
              disabled={selectedRowKeys.length === 0}
              style={{ borderRadius: 6 }}
            >
              批量删除
            </Button>
            <Button
              type="outline"
              onClick={() => handleExport(false)}
              loading={exportLoading}
              style={{ borderRadius: 6 }}
            >
              导出全部
            </Button>
            <Button
              type="outline"
              onClick={() => handleExport(true)}
              disabled={selectedRowKeys.length === 0}
              loading={exportLoading}
              style={{ borderRadius: 6 }}
            >
              导出选中
            </Button>
            <Button
              icon={<IconRefresh />}
              onClick={() => fetchCustomers()}
              style={{ borderRadius: 6 }}
            >
              刷新
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
          border={{ 
            wrapper: true, 
            cell: true 
          }}
          scroll={{ x: 900 }}
          style={{ 
            borderRadius: 6,
            overflow: 'hidden'
          }}
          noDataElement={
            <div style={{ 
              padding: '60px 0', 
              textAlign: 'center', 
              color: '#86909C',
              fontSize: '14px'
            }}>
              <div style={{ marginBottom: 8 }}>暂无数据</div>
              <div style={{ fontSize: '12px', color: '#C2C7CC' }}>请尝试调整搜索条件</div>
            </div>
          }
        />
      </Card>

            {/* 新增/编辑模态框 */}
      <Modal
        title={
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1D2129' }}>
            编辑客户地址
          </div>
        }
        visible={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        okText="确定"
        cancelText="取消"
        style={{ borderRadius: 8 }}
        width={800}
      >
        <Form form={form} layout="vertical">
          {editingRecord && (
            <Form.Item label="客户编号" style={{ marginBottom: 20 }}>
              <Input
                value={editingRecord.customerNumber}
                disabled
                style={{
                  backgroundColor: '#f7f8fa',
                  borderRadius: 6,
                  color: '#86909C'
                }}
              />
            </Form.Item>
          )}
          <Form.Item label="客户名" style={{ marginBottom: 20 }}>
            <Input
              value={editingRecord?.customerName || ''}
              disabled
              style={{
                backgroundColor: '#f7f8fa',
                borderRadius: 6,
                color: '#86909C'
              }}
            />
          </Form.Item>

          {/* 门店地址区域 */}
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f7f8fa', borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#1D2129', fontSize: '14px', fontWeight: 600 }}>门店地址</h4>
            <Form.Item
              label="门店地址"
              field="storeAddress"
              style={{ marginBottom: 16 }}
            >
              <Input.TextArea
                placeholder="请输入门店地址（遵循省市区/城镇格式）"
                rows={2}
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <Form.Item label="门店经度" field="storeLongitude" style={{ flex: 1, marginBottom: 0 }}>
                <Input
                  placeholder="经度（经度在前）"
                  style={{ borderRadius: 6 }}
                  readOnly={!storeCoordinatesEditable}
                />
              </Form.Item>
              <Form.Item label="门店纬度" field="storeLatitude" style={{ flex: 1, marginBottom: 0 }}>
                <Input
                  placeholder="纬度（纬度在后）"
                  style={{ borderRadius: 6 }}
                  readOnly={!storeCoordinatesEditable}
                />
              </Form.Item>
            </div>
            <Space size={12}>
              <Button
                type="outline"
                onClick={() => handleGeocodeInModal('store')}
                loading={geocodeLoading}
                style={{ borderRadius: 6 }}
              >
                获取经纬度
              </Button>
              <Button
                type="outline"
                onClick={() => handleReverseGeocodeInModal('store')}
                loading={geocodeLoading}
                style={{ borderRadius: 6 }}
              >
                获取地址
              </Button>
              <Button
                type={storeCoordinatesEditable ? "primary" : "text"}
                onClick={() => setStoreCoordinatesEditable(!storeCoordinatesEditable)}
                style={{ borderRadius: 6 }}
              >
                {storeCoordinatesEditable ? '锁定经纬度' : '修正经纬度'}
              </Button>
            </Space>
          </div>

          {/* 仓库地址区域 */}
          <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f7f8fa', borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#1D2129', fontSize: '14px', fontWeight: 600 }}>仓库地址</h4>
            <Form.Item
              label="仓库地址"
              field="warehouseAddress"
              style={{ marginBottom: 16 }}
            >
              <Input.TextArea
                placeholder="请输入仓库地址（遵循省市区/城镇格式）"
                rows={2}
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <Form.Item label="仓库经度" field="warehouseLongitude" style={{ flex: 1, marginBottom: 0 }}>
                <Input
                  placeholder="经度（经度在前）"
                  style={{ borderRadius: 6 }}
                  readOnly={!warehouseCoordinatesEditable}
                />
              </Form.Item>
              <Form.Item label="仓库纬度" field="warehouseLatitude" style={{ flex: 1, marginBottom: 0 }}>
                <Input
                  placeholder="纬度（纬度在后）"
                  style={{ borderRadius: 6 }}
                  readOnly={!warehouseCoordinatesEditable}
                />
              </Form.Item>
            </div>
            <Space size={12}>
              <Button
                type="outline"
                onClick={() => handleGeocodeInModal('warehouse')}
                loading={geocodeLoading}
                style={{ borderRadius: 6 }}
              >
                获取经纬度
              </Button>
              <Button
                type="outline"
                onClick={() => handleReverseGeocodeInModal('warehouse')}
                loading={geocodeLoading}
                style={{ borderRadius: 6 }}
              >
                获取地址
              </Button>
              <Button
                type={warehouseCoordinatesEditable ? "primary" : "text"}
                onClick={() => setWarehouseCoordinatesEditable(!warehouseCoordinatesEditable)}
                style={{ borderRadius: 6 }}
              >
                {warehouseCoordinatesEditable ? '锁定经纬度' : '修正经纬度'}
              </Button>
            </Space>
          </div>

          <Form.Item label="状态" style={{ marginBottom: 0 }}>
            <Input
              value={editingRecord?.status === 'active' ? '启用' : '禁用'}
              disabled
              style={{
                backgroundColor: '#f7f8fa',
                borderRadius: 6,
                color: '#86909C'
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

              {/* 删除确认模态框 */}
        <Modal
          title={
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1D2129' }}>
              确认删除
            </div>
          }
          visible={deleteModalVisible}
          onOk={confirmDelete}
          onCancel={() => {
            setDeleteModalVisible(false);
            setDeletingRecord(null);
          }}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ status: 'danger' }}
          style={{ borderRadius: 8 }}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1D2129' }}>
              确定要删除客户 <strong>"{deletingRecord?.customerName}"</strong> 吗？
            </p>
            <p style={{ color: '#86909C', fontSize: '12px', margin: 0 }}>
              此操作不可撤销，请谨慎操作。
            </p>
          </div>
        </Modal>

        {/* 批量删除确认模态框 */}
        <Modal
          title={
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1D2129' }}>
              确认批量删除
            </div>
          }
          visible={batchDeleteModalVisible}
          onOk={confirmBatchDelete}
          onCancel={() => setBatchDeleteModalVisible(false)}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ status: 'danger' }}
          style={{ borderRadius: 8 }}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1D2129' }}>
              确定要删除选中的 <strong>{selectedRowKeys.length}</strong> 个客户吗？
            </p>
            <p style={{ color: '#86909C', fontSize: '12px', margin: 0 }}>
              此操作不可撤销，请谨慎操作。
            </p>
          </div>
        </Modal>

        {/* 地址管理模态框 */}
        <Modal
          title={
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1D2129' }}>
              地址管理 - {editingRecord?.customerName}
            </div>
          }
          visible={geocodeModalVisible}
          onOk={handleSaveAddress}
          onCancel={() => setGeocodeModalVisible(false)}
          confirmLoading={loading}
          okText="保存"
          cancelText="取消"
          style={{ borderRadius: 8 }}
          width={800}
        >
          <Form form={geocodeForm} layout="vertical">
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#1D2129', fontSize: '14px', fontWeight: 600 }}>门店地址</h4>
              <Form.Item label="门店地址" field="storeAddress" style={{ marginBottom: 16 }}>
                <Input.TextArea
                  placeholder="请输入门店地址（遵循省市区/城镇格式）"
                  rows={2}
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <Form.Item label="门店经度" field="storeLongitude" style={{ flex: 1, marginBottom: 0 }}>
                  <Input
                    placeholder="经度（经度在前）"
                    style={{ borderRadius: 6 }}
                    readOnly={!storeCoordinatesEditable}
                  />
                </Form.Item>
                <Form.Item label="门店纬度" field="storeLatitude" style={{ flex: 1, marginBottom: 0 }}>
                  <Input
                    placeholder="纬度（纬度在后）"
                    style={{ borderRadius: 6 }}
                    readOnly={!storeCoordinatesEditable}
                  />
                </Form.Item>
              </div>
              <Space size={12}>
                <Button
                  type="outline"
                  onClick={() => handleGeocode('store')}
                  loading={geocodeLoading}
                  style={{ borderRadius: 6 }}
                >
                  获取经纬度
                </Button>
                <Button
                  type="outline"
                  onClick={() => handleReverseGeocode('store')}
                  loading={geocodeLoading}
                  style={{ borderRadius: 6 }}
                >
                  获取地址
                </Button>
                <Button
                  type={storeCoordinatesEditable ? "primary" : "text"}
                  onClick={() => {
                    if (storeCoordinatesEditable) {
                      // 如果当前是编辑状态，点击后保存并锁定
                      setStoreCoordinatesEditable(false);
                    } else {
                      // 如果当前是锁定状态，点击后解锁编辑
                      setStoreCoordinatesEditable(true);
                    }
                  }}
                  style={{ borderRadius: 6 }}
                >
                  {storeCoordinatesEditable ? '锁定经纬度' : '修正经纬度'}
                </Button>
              </Space>
            </div>

            <div>
              <h4 style={{ margin: '0 0 16px 0', color: '#1D2129', fontSize: '14px', fontWeight: 600 }}>仓库地址</h4>
              <Form.Item label="仓库地址" field="warehouseAddress" style={{ marginBottom: 16 }}>
                <Input.TextArea
                  placeholder="请输入仓库地址（遵循省市区/城镇格式）"
                  rows={2}
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <Form.Item label="仓库经度" field="warehouseLongitude" style={{ flex: 1, marginBottom: 0 }}>
                  <Input
                    placeholder="经度（经度在前）"
                    style={{ borderRadius: 6 }}
                    readOnly={!warehouseCoordinatesEditable}
                  />
                </Form.Item>
                <Form.Item label="仓库纬度" field="warehouseLatitude" style={{ flex: 1, marginBottom: 0 }}>
                  <Input
                    placeholder="纬度（纬度在后）"
                    style={{ borderRadius: 6 }}
                    readOnly={!warehouseCoordinatesEditable}
                  />
                </Form.Item>
              </div>
              <Space size={12}>
                <Button
                  type="outline"
                  onClick={() => handleGeocode('warehouse')}
                  loading={geocodeLoading}
                  style={{ borderRadius: 6 }}
                >
                  获取经纬度
                </Button>
                <Button
                  type="outline"
                  onClick={() => handleReverseGeocode('warehouse')}
                  loading={geocodeLoading}
                  style={{ borderRadius: 6 }}
                >
                  获取地址
                </Button>
                <Button
                  type={warehouseCoordinatesEditable ? "primary" : "text"}
                  onClick={() => {
                    if (warehouseCoordinatesEditable) {
                      // 如果当前是编辑状态，点击后保存并锁定
                      setWarehouseCoordinatesEditable(false);
                    } else {
                      // 如果当前是锁定状态，点击后解锁编辑
                      setWarehouseCoordinatesEditable(true);
                    }
                  }}
                  style={{ borderRadius: 6 }}
                >
                  {warehouseCoordinatesEditable ? '锁定经纬度' : '修正经纬度'}
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* 同步确认模态框 */}
        <Modal
          title={
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1D2129' }}>
              同步客户数据
            </div>
          }
          visible={syncModalVisible}
          onOk={handleConfirmSync}
          onCancel={() => setSyncModalVisible(false)}
          confirmLoading={syncLoading}
          okText="确认同步"
          cancelText="取消"
          style={{ borderRadius: 8 }}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1D2129' }}>
              确定要同步客户数据吗？
            </p>
            <p style={{ color: '#86909C', fontSize: '12px', margin: '0 0 12px 0' }}>
              将与另一个系统同步客户数据，地址信息以当前系统为准。
            </p>
            {lastSyncTime && (
              <p style={{ color: '#86909C', fontSize: '12px', margin: 0 }}>
                上次同步时间：{formatDateTime(lastSyncTime)}
              </p>
            )}
          </div>
        </Modal>
    </div>
  );
}