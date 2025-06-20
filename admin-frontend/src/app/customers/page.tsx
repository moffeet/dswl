'use client';

import React, { useState } from 'react';

// 模拟数据
const mockData = [
  {
    id: 232,
    customerCode: 'C001',
    name: '北京物流公司',
    contactPerson: '张三',
    phone: '13800138000',
    address: '北京市朝阳区xxx街道',
    region: '🟠 临沂沂南',
    status: '已上线',
    updateTime: '2021-02-28 10:30',
    updatedBy: '已上线'
  },
  {
    id: 254,
    customerCode: 'C002',
    name: '上海运输有限公司',
    contactPerson: '李四',
    phone: '13900139000',
    address: '上海市浦东新区yyy路',
    region: '🔵 临沂',
    status: '已上线',
    updateTime: '2021-02-28 10:30',
    updatedBy: '已上线'
  },
  {
    id: 46,
    customerCode: 'C003',
    name: '广州配送中心',
    contactPerson: '王五',
    phone: '13700137000',
    address: '广州市天河区zzz大厦',
    region: '🔴 横沂沂南',
    status: '已上线',
    updateTime: '2021-02-28 10:30',
    updatedBy: '已上线'
  },
  {
    id: 577,
    customerCode: 'C004',
    name: '深圳快递公司',
    contactPerson: '赵六',
    phone: '13600136000',
    address: '深圳市南山区aaa科技园',
    region: '🔵 临沂',
    status: '已上线',
    updateTime: '2021-02-28 10:30',
    updatedBy: '已上线'
  }
];

export default function CustomersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(mockData);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
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

  // 搜索功能
  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('搜索完成');
    }, 1000);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchValues({
      customerCode: '',
      customerName: '',
      region: ''
    });
    setData(mockData);
  };

  // 新建/编辑客户
  const handleEdit = (record?: any) => {
    setEditingRecord(record);
    if (record) {
      setFormValues(record);
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
  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      
      if (editingRecord) {
        // 编辑
        const newData = data.map(item => 
          item.id === editingRecord.id ? { ...item, ...formValues } : item
        );
        setData(newData);
        alert('客户信息更新成功');
      } else {
        // 新建
        const newCustomer = {
          id: Date.now(),
          ...formValues,
          status: '已上线',
          updateTime: new Date().toLocaleString(),
          updatedBy: '当前用户'
        };
        setData([newCustomer, ...data]);
        alert('客户创建成功');
      }
      
      setModalVisible(false);
      setEditingRecord(null);
    }, 1000);
  };

  // 删除客户
  const handleDelete = (id: number) => {
    if (confirm('确定要删除这个客户吗？')) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setData(data.filter(item => item.id !== id));
        alert('客户删除成功');
      }, 1000);
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRows.length === 0) {
      alert('请选择要删除的客户');
      return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedRows.length} 个客户吗？`)) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setData(data.filter(item => !selectedRows.includes(item.id)));
        setSelectedRows([]);
        alert(`成功删除 ${selectedRows.length} 个客户`);
      }, 1000);
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '6px', padding: '24px' }}>
          {/* 搜索表单 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '16px', fontWeight: 'bold' }}>查询表格</h3>
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
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>客户地址</label>
                <select
                  value={searchValues.region}
                  onChange={(e) => setSearchValues({...searchValues, region: e.target.value})}
                  style={{ width: 150, height: 32, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="">全部</option>
                  <option value="临沂沂南">临沂沂南</option>
                  <option value="临沂">临沂</option>
                  <option value="横沂沂南">横沂沂南</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSearch}
                  style={{ height: 32, padding: '0 16px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  🔍 查询
                </button>
                <button
                  onClick={handleReset}
                  style={{ height: 32, padding: '0 16px', backgroundColor: '#fff', color: '#666', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}
                >
                  🔄 重置
                </button>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleEdit()}
                style={{ height: 32, padding: '0 16px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ➕ 新建
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={selectedRows.length === 0}
                style={{ 
                  height: 32, 
                  padding: '0 16px', 
                  backgroundColor: selectedRows.length === 0 ? '#f5f5f5' : '#ff4d4f', 
                  color: selectedRows.length === 0 ? '#ccc' : 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: selectedRows.length === 0 ? 'not-allowed' : 'pointer' 
                }}
              >
                批量删除
              </button>
            </div>
            <button
              style={{ height: 32, padding: '0 16px', backgroundColor: '#fff', color: '#666', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}
            >
              📥 下载
            </button>
          </div>

          {/* 数据表格 */}
          <div style={{ border: '1px solid #f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#fafafa' }}>
                <tr>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: 50 }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.length === data.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: 100 }}>客户编号</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>客户名称</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: 120 }}>联系人</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: 140 }}>联系电话</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: 150 }}>客户地址</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: 180 }}>更新时间</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: 100 }}>更新人</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: 180 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((record) => (
                  <tr key={record.id} style={{ backgroundColor: selectedRows.includes(record.id) ? '#e6f7ff' : 'white' }}>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(record.id)}
                        onChange={(e) => handleRowSelect(record.id, e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.id}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.name}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.contactPerson}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.phone}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        backgroundColor: record.region.includes('🟠') ? '#fff7e6' : record.region.includes('🔵') ? '#e6f7ff' : '#fff2f0',
                        color: record.region.includes('🟠') ? '#fa8c16' : record.region.includes('🔵') ? '#1890ff' : '#f5222d'
                      }}>
                        {record.region}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>{record.updateTime}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#e6f7ff', color: '#1890ff' }}>
                        {record.updatedBy}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(record)}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', color: '#1890ff', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                        >
                          查看
                        </button>
                        <button
                          onClick={() => handleEdit(record)}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', color: '#1890ff', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                        >
                          查看
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
                ))}
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
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>客户地址 *</label>
                <select
                  value={formValues.region}
                  onChange={(e) => setFormValues({...formValues, region: e.target.value})}
                  style={{ width: '100%', height: 40, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="">请选择客户地址</option>
                  <option value="🟠 临沂沂南">🟠 临沂沂南</option>
                  <option value="🔵 临沂">🔵 临沂</option>
                  <option value="🔴 横沂沂南">🔴 横沂沂南</option>
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