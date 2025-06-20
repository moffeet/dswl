'use client';

import React, { useState, useEffect } from 'react';

// 客户数据类型
interface Customer {
  id: number;
  customerCode: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Customer[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Customer | null>(null);
  const [searchValues, setSearchValues] = useState({
    customerCode: '',
    customerName: '',
    region: ''
  });
  const [formValues, setFormValues] = useState({
    customerCode: '',
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    region: ''
  });

  // 获取客户列表
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/customers');
      if (response.ok) {
        const result = await response.json();
        // 后端返回的格式是 { code, message, data: [] }
        if (result.code === 0 && Array.isArray(result.data)) {
          // 映射后端字段到前端期望的字段
          const mappedData = result.data.map((item: any) => ({
            id: item.id,
            customerCode: item.customerNumber,
            name: item.customerName,
            contactPerson: item.contactPerson,
            phone: item.contactPhone,
            address: item.customerAddress,
            region: item.area,
            latitude: item.latitude,
            longitude: item.longitude,
            status: item.status,
            createdAt: item.createTime,
            updatedAt: item.createTime // 如果没有updatedAt就用createTime
          }));
          setData(mappedData);
        } else {
          console.log('API返回的数据格式:', result);
          setData([]);
          alert(`获取数据失败: ${result.message || '未知错误'}`);
        }
      } else {
        console.error('HTTP错误:', response.status, response.statusText);
        setData([]);
        alert(`获取客户数据失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('获取客户数据错误:', error);
      setData([]);
      alert('连接服务器失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 搜索功能
  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchValues.customerCode) params.append('customerCode', searchValues.customerCode);
      if (searchValues.customerName) params.append('name', searchValues.customerName);
      if (searchValues.region) params.append('region', searchValues.region);

      const url = `http://localhost:3000/api/customers/search?${params.toString()}`;
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          // 映射后端字段到前端期望的字段
          const mappedData = result.data.map((item: any) => ({
            id: item.id,
            customerCode: item.customerNumber,
            name: item.customerName,
            contactPerson: item.contactPerson,
            phone: item.contactPhone,
            address: item.customerAddress,
            region: item.area,
            latitude: item.latitude,
            longitude: item.longitude,
            status: item.status,
            createdAt: item.createTime,
            updatedAt: item.createTime
          }));
          setData(mappedData);
        } else {
          alert(`搜索失败: ${result.message || '未知错误'}`);
        }
      } else {
        alert('搜索失败');
      }
    } catch (error) {
      console.error('搜索错误:', error);
      alert('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置搜索
  const handleReset = () => {
    setSearchValues({
      customerCode: '',
      customerName: '',
      region: ''
    });
    fetchCustomers();
  };

  // 新建/编辑客户
  const handleEdit = (record?: Customer) => {
    setEditingRecord(record || null);
    if (record) {
      setFormValues({
        customerCode: record.customerCode,
        name: record.name,
        contactPerson: record.contactPerson,
        phone: record.phone,
        address: record.address,
        region: record.region || ''
      });
    } else {
      setFormValues({
        customerCode: '',
        name: '',
        contactPerson: '',
        phone: '',
        address: '',
        region: ''
      });
    }
    setModalVisible(true);
  };

  // 保存客户
  const handleSave = async () => {
    if (!formValues.customerCode || !formValues.name || !formValues.contactPerson || !formValues.phone || !formValues.address) {
      alert('请填写所有必填字段');
      return;
    }

    setLoading(true);
    try {
      const url = editingRecord 
        ? `http://localhost:3000/api/customers/${editingRecord.id}`
        : 'http://localhost:3000/api/customers';
      
      const method = editingRecord ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });

      if (response.ok) {
        alert(editingRecord ? '客户信息更新成功' : '客户创建成功');
        setModalVisible(false);
        setEditingRecord(null);
        fetchCustomers();
      } else {
        const error = await response.text();
        alert(`操作失败: ${error}`);
      }
    } catch (error) {
      console.error('保存客户错误:', error);
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除客户
  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个客户吗？')) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/customers/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('客户删除成功');
          fetchCustomers();
        } else {
          alert('删除失败');
        }
      } catch (error) {
        console.error('删除客户错误:', error);
        alert('删除失败');
      } finally {
        setLoading(false);
      }
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRows.length === 0) {
      alert('请选择要删除的客户');
      return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedRows.length} 个客户吗？`)) {
      setLoading(true);
      try {
        const deletePromises = selectedRows.map(id => 
          fetch(`http://localhost:3000/api/customers/${id}`, { method: 'DELETE' })
        );
        
        await Promise.all(deletePromises);
        alert(`成功删除 ${selectedRows.length} 个客户`);
        setSelectedRows([]);
        fetchCustomers();
      } catch (error) {
        console.error('批量删除错误:', error);
        alert('批量删除失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRowSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(data.map(item => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getRegionColor = (region?: string) => {
    if (!region) return { backgroundColor: '#f5f5f5', color: '#666' };
    
    if (region.includes('临沂沂南')) return { backgroundColor: '#fff7e6', color: '#fa8c16' };
    if (region.includes('临沂')) return { backgroundColor: '#e6f7ff', color: '#1890ff' };
    if (region.includes('横沂')) return { backgroundColor: '#fff2f0', color: '#f5222d' };
    
    return { backgroundColor: '#f5f5f5', color: '#666' };
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '6px', padding: '24px' }}>
        {/* 搜索表单 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 'bold' }}>客户管理</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>客户编号</label>
              <input
                type="text"
                placeholder="请输入客户编号"
                value={searchValues.customerCode}
                onChange={(e) => setSearchValues({...searchValues, customerCode: e.target.value})}
                style={{ width: 200, height: 32, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>客户名称</label>
              <input
                type="text"
                placeholder="请输入客户名称"
                value={searchValues.customerName}
                onChange={(e) => setSearchValues({...searchValues, customerName: e.target.value})}
                style={{ width: 200, height: 32, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>区域</label>
              <select
                value={searchValues.region}
                onChange={(e) => setSearchValues({...searchValues, region: e.target.value})}
                style={{ width: 200, height: 32, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              >
                <option value="">全部</option>
                <option value="临沂沂南">临沂沂南</option>
                <option value="临沂">临沂</option>
                <option value="横沂">横沂</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSearch}
                disabled={loading}
                style={{ 
                  padding: '6px 16px', 
                  backgroundColor: loading ? '#f5f5f5' : '#1890ff', 
                  color: loading ? '#ccc' : 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: loading ? 'not-allowed' : 'pointer' 
                }}
              >
                {loading ? '搜索中...' : '查询'}
              </button>
              <button
                onClick={handleReset}
                style={{ padding: '6px 16px', backgroundColor: '#fff', color: '#666', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}
              >
                重置
              </button>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => handleEdit()}
            style={{ padding: '6px 12px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ➕ 新建
          </button>
          <button
            onClick={handleBatchDelete}
            disabled={selectedRows.length === 0}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: selectedRows.length === 0 ? '#f5f5f5' : '#ff4d4f', 
              color: selectedRows.length === 0 ? '#ccc' : 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: selectedRows.length === 0 ? 'not-allowed' : 'pointer' 
            }}
          >
            🗑️ 删除 ({selectedRows.length})
          </button>
          <button
            onClick={fetchCustomers}
            disabled={loading}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#52c41a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            🔄 刷新
          </button>
        </div>

        {/* 表格 */}
        <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#fafafa' }}>
              <tr>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'left' }}>客户ID</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'left' }}>客户编号</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'left' }}>客户名称</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'left' }}>联系人</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'left' }}>联系电话</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'left' }}>客户地址</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'left' }}>区域</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'left' }}>更新时间</th>
                <th style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', textAlign: 'left' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    {loading ? '加载中...' : '暂无数据'}
                  </td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr key={record.id} style={{ backgroundColor: selectedRows.includes(record.id) ? '#e6f7ff' : 'white' }}>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(record.id)}
                        onChange={(e) => handleRowSelect(record.id, e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.id}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.customerCode}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.name}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.contactPerson}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.phone}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.address}>
                      {record.address}
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                      {record.region && (
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          ...getRegionColor(record.region)
                        }}>
                          {record.region}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{formatDate(record.updatedAt)}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(record)}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', color: '#1890ff', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', color: '#ff4d4f', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 分页 */}
          <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>共 {data.length} 条记录</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button style={{ padding: '4px 8px', border: '1px solid #d9d9d9', backgroundColor: '#fff', cursor: 'pointer' }}>上一页</button>
              <span style={{ padding: '4px 8px', backgroundColor: '#1890ff', color: 'white', borderRadius: '4px' }}>1</span>
              <button style={{ padding: '4px 8px', border: '1px solid #d9d9d9', backgroundColor: '#fff', cursor: 'pointer' }}>下一页</button>
            </div>
          </div>
        </div>
      </div>

      {/* 新建/编辑客户弹窗 */}
      {modalVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              {editingRecord ? '编辑客户' : '新建客户'}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>客户编号 *</label>
                <input
                  type="text"
                  placeholder="请输入客户编号"
                  value={formValues.customerCode}
                  onChange={(e) => setFormValues({...formValues, customerCode: e.target.value})}
                  style={{ width: '100%', height: 40, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>客户名称 *</label>
                <input
                  type="text"
                  placeholder="请输入客户名称"
                  value={formValues.name}
                  onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                  style={{ width: '100%', height: 40, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>联系人 *</label>
                <input
                  type="text"
                  placeholder="请输入联系人"
                  value={formValues.contactPerson}
                  onChange={(e) => setFormValues({...formValues, contactPerson: e.target.value})}
                  style={{ width: '100%', height: 40, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>联系电话 *</label>
                <input
                  type="text"
                  placeholder="请输入联系电话"
                  value={formValues.phone}
                  onChange={(e) => setFormValues({...formValues, phone: e.target.value})}
                  style={{ width: '100%', height: 40, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>详细地址 *</label>
                <input
                  type="text"
                  placeholder="请输入详细地址"
                  value={formValues.address}
                  onChange={(e) => setFormValues({...formValues, address: e.target.value})}
                  style={{ width: '100%', height: 40, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>区域</label>
                <select
                  value={formValues.region}
                  onChange={(e) => setFormValues({...formValues, region: e.target.value})}
                  style={{ width: '100%', height: 40, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="">请选择区域</option>
                  <option value="临沂沂南">临沂沂南</option>
                  <option value="临沂">临沂</option>
                  <option value="横沂">横沂</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setModalVisible(false);
                  setEditingRecord(null);
                }}
                style={{ padding: '8px 16px', backgroundColor: '#fff', color: '#666', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: loading ? '#f5f5f5' : '#1890ff', 
                  color: loading ? '#ccc' : 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: loading ? 'not-allowed' : 'pointer' 
                }}
              >
                {loading ? '保存中...' : (editingRecord ? '更新' : '创建')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 