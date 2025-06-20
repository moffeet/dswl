'use client';

import React from 'react';
import { Button, Card, Space } from '@arco-design/web-react';
import { Grid } from '@arco-design/web-react';
import { IconUser, IconUserGroup, IconSettings, IconCalendar } from '@arco-design/web-react/icon';
import { useRouter } from 'next/navigation';

const { Row, Col } = Grid;

export default function Home() {
  const router = useRouter();

  const menuItems = [
    {
      title: '客户管理',
      description: '管理客户信息、联系方式和地址',
      icon: <IconUser style={{ fontSize: '32px', color: '#1890ff' }} />,
      path: '/customers',
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
    {
      title: '司机管理',
      description: '管理配送司机信息',
      icon: <span style={{ fontSize: '32px', color: '#722ed1' }}>🚛</span>,
      path: '/drivers',
      color: '#722ed1',
    },
    {
      title: '打卡记录',
      description: '查看配送打卡记录和统计',
      icon: <IconCalendar style={{ fontSize: '32px', color: '#f5222d' }} />,
      path: '/checkin',
      color: '#f5222d',
    },
  ];

  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* 欢迎区域 */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
          🎯 物流配送管理系统
        </h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
          专业的物流配送管理解决方案，助力企业高效运营
        </p>
        <Space size="large">
          <Button type="primary" size="large" onClick={() => router.push('/customers')}>
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
