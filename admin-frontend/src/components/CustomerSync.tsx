'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Modal, 
  Message, 
  Card, 
  Descriptions, 
  Space, 
  Typography, 
  Spin,
  Alert,
  Progress
} from '@arco-design/web-react';
import { IconSync, IconInfoCircle, IconCheckCircle, IconCloseCircle } from '@arco-design/web-react/icon';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

const { Title, Text } = Typography;

interface SyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  lastSyncTime: string;
}

interface SyncMetadata {
  dataSource: string;
  currentCustomerCount: number;
  externalCustomerCount: number;
  lastSyncTime: string;
  syncVersion: string;
}

interface CustomerSyncProps {
  onSyncComplete?: () => void;
}

export default function CustomerSync({ onSyncComplete }: CustomerSyncProps) {
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // 获取同步元数据
  const fetchSyncMetadata = async () => {
    setLoadingMetadata(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.customers}/sync-metadata`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 200) {
          setSyncMetadata(result.data);
        }
      }
    } catch (error) {
      console.error('获取同步元数据失败:', error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  // 执行同步
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.customers}/sync`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.code === 200) {
          setSyncResult(result.data);

          // 显示同步结果弹窗
          const { createdCount, updatedCount, syncedCount } = result.data;
          Modal.success({
            title: '同步完成',
            content: (
              <div>
                <p>本次同步处理了 <strong>{syncedCount}</strong> 个客户：</p>
                <ul style={{ marginLeft: 20, marginTop: 8 }}>
                  <li>新增客户：<strong style={{ color: '#00B42A' }}>{createdCount}</strong> 个</li>
                  <li>更新客户：<strong style={{ color: '#1890FF' }}>{updatedCount}</strong> 个</li>
                </ul>
              </div>
            ),
            okText: '确定'
          });

          // 刷新元数据
          await fetchSyncMetadata();

          // 通知父组件刷新数据
          if (onSyncComplete) {
            onSyncComplete();
          }
        } else {
          Message.error(`同步失败: ${result.message}`);
        }
      } else {
        Message.error(`同步失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('同步失败:', error);
      Message.error('同步失败，请检查网络连接');
    } finally {
      setSyncing(false);
    }
  };

  // 打开同步对话框时获取元数据
  const handleOpenSyncModal = () => {
    setSyncModalVisible(true);
    fetchSyncMetadata();
  };

  // 格式化时间
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 计算同步进度（模拟）
  const getSyncProgress = () => {
    if (!syncing) return 0;
    return syncResult ? 100 : 50;
  };

  return (
    <>
      {/* 同步按钮 */}
      <Button
        type="primary"
        icon={<IconSync />}
        onClick={handleOpenSyncModal}
        style={{ marginLeft: 8 }}
      >
        同步数据
      </Button>

      {/* 同步对话框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconSync />
            <span>外部系统数据同步</span>
          </div>
        }
        visible={syncModalVisible}
        onCancel={() => setSyncModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setSyncModalVisible(false)}>
              取消
            </Button>
            <Button
              type="primary"
              loading={syncing}
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? '同步中...' : '开始同步'}
            </Button>
          </Space>
        }
        style={{ width: 600 }}
        maskClosable={false}
      >
        <div style={{ padding: '16px 0' }}>
          {/* 同步说明 */}
          <Alert
            type="info"
            content={
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>同步规则说明：</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>以客户ID为基准进行数据匹配</li>
                  <li>门店地址和仓库地址以当前系统为准（不会被覆盖）</li>
                  <li>其他信息（客户名称、联系人等）以外部系统为准</li>
                  <li>新客户将被创建，现有客户信息将被更新</li>
                </ul>
              </div>
            }
            style={{ marginBottom: 16 }}
          />

          {/* 同步元数据 */}
          {loadingMetadata ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin />
              <div style={{ marginTop: 8 }}>加载同步信息...</div>
            </div>
          ) : syncMetadata ? (
            <Card title="外部系统信息" style={{ marginBottom: 16 }}>
              <Descriptions
                column={2}
                data={[
                  {
                    label: '数据源',
                    value: syncMetadata.dataSource
                  },
                  {
                    label: '同步版本',
                    value: syncMetadata.syncVersion
                  },
                  {
                    label: '外部系统客户数',
                    value: `${syncMetadata.externalCustomerCount} 个`
                  },
                  {
                    label: '当前系统客户数',
                    value: `${syncMetadata.currentCustomerCount} 个`
                  },
                  {
                    label: '上次同步',
                    value: formatDateTime(syncMetadata.lastSyncTime)
                  }
                ]}
              />
            </Card>
          ) : null}

          {/* 同步进度 */}
          {syncing && (
            <Card title="同步进度" style={{ marginBottom: 16 }}>
              <Progress
                percent={getSyncProgress()}
                status={syncResult ? 'success' : 'normal'}
                showText={true}
              />
              <div style={{ marginTop: 8, textAlign: 'center', color: '#86909C' }}>
                {syncResult ? '同步完成' : '正在同步数据...'}
              </div>
            </Card>
          )}

          {/* 同步结果 */}
          {syncResult && (
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {syncResult.success ? (
                    <IconCheckCircle style={{ color: '#00B42A' }} />
                  ) : (
                    <IconCloseCircle style={{ color: '#F53F3F' }} />
                  )}
                  <span>同步结果</span>
                </div>
              }
            >
              <Alert
                type={syncResult.success ? 'success' : 'error'}
                content={syncResult.message}
                style={{ marginBottom: 16 }}
              />
              
              {syncResult.success && (
                <Descriptions
                  column={2}
                  data={[
                    {
                      label: '处理总数',
                      value: `${syncResult.syncedCount} 个客户`
                    },
                    {
                      label: '新增客户',
                      value: (
                        <Text type={syncResult.createdCount > 0 ? 'success' : 'secondary'}>
                          {syncResult.createdCount} 个
                        </Text>
                      )
                    },
                    {
                      label: '更新客户',
                      value: (
                        <Text type={syncResult.updatedCount > 0 ? 'warning' : 'secondary'}>
                          {syncResult.updatedCount} 个
                        </Text>
                      )
                    },
                    {
                      label: '跳过客户',
                      value: (
                        <Text type="secondary">
                          {syncResult.skippedCount} 个
                        </Text>
                      )
                    },
                    {
                      label: '同步时间',
                      value: formatDateTime(syncResult.lastSyncTime)
                    }
                  ]}
                />
              )}
            </Card>
          )}
        </div>
      </Modal>
    </>
  );
}
