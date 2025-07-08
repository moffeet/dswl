'use client';

import React from 'react';
import { Button, Card, Space, Alert, Result } from '@arco-design/web-react';
import { Grid } from '@arco-design/web-react';
import { IconUser, IconUserGroup, IconSettings, IconLock } from '@arco-design/web-react/icon';
import { useRouter } from 'next/navigation';
import { usePermission } from './context/permission';
import { useAuth } from './context/auth';

const { Row, Col } = Grid;

export default function Home() {
  const router = useRouter();
  const { hasRole, permissionInfo, isLoading } = usePermission();
  const { user } = useAuth();

  const menuItems = [
    {
      title: '客户地址',
      description: '管理客户信息、联系方式和地址',
      icon: <IconUser style={{ fontSize: '32px', color: '#1890ff' }} />,
      path: '/customer',
      color: '#1890ff',
    },
    {
      title: '用户管理',
      description: '管理系统用户、权限分配',
      icon: <IconUserGroup style={{ fontSize: '32px', color: '#52c41a' }} />,
      path: '/users',
      color: '#52c41a',
    },
    {
      title: '角色权限',
      description: '配置角色权限和访问控制',
      icon: <IconSettings style={{ fontSize: '32px', color: '#faad14' }} />,
      path: '/roles',
      color: '#faad14',
    },

  ];

  // 如果正在加载权限信息
  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>正在加载...</div>
      </div>
    );
  }

  // 如果没有角色，显示特殊提示
  if (!hasRole) {
    return (
      <div style={{ padding: '40px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
            🎯 物流配送管理系统
          </h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
            欢迎 {user?.nickname || user?.username}！
          </p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Result
            status="warning"
            title="权限受限"
            subTitle="您还没有分配角色，目前只能访问首页。请联系系统管理员为您分配合适的角色以获得更多功能权限。"
            extra={[
              <Alert
                key="info"
                type="info"
                content="系统管理员可以在「角色权限」模块中为您分配角色，分配后您将能够访问相应的功能模块。"
                style={{ marginTop: '20px', textAlign: 'left' }}
              />
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* 欢迎区域 */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
          🎯 物流配送管理系统
        </h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
          欢迎回来，{user?.nickname || user?.username}！专业的物流配送管理解决方案，助力企业高效运营
        </p>
        <Space size="large">
          <Button type="primary" size="large" onClick={() => router.push('/customer')}>
            开始使用
          </Button>
          <Button size="large" onClick={() => router.push('/users')}>
            用户管理
          </Button>
        </Space>
      </div>

      {/* 功能模块卡片 */}
      <Row gutter={24}>
        {menuItems.map((item, index) => (
          <Col span={8} key={index} style={{ marginBottom: '24px' }}>
            <Card
              hoverable
              style={{
                height: '200px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
              }}
              onClick={() => router.push(item.path)}
            >
              <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ marginBottom: '16px' }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                  {item.description}
                </p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 系统信息 */}
      <Card style={{ marginTop: '32px' }}>
        <Row gutter={24}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>150+</h4>
              <p style={{ color: '#666', margin: 0 }}>注册用户</p>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>2,500+</h4>
              <p style={{ color: '#666', margin: 0 }}>客户数量</p>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#faad14', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>98.5%</h4>
              <p style={{ color: '#666', margin: 0 }}>配送成功率</p>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
