'use client';

import { useState } from 'react';
import { useAuth } from '../app/context/auth';
import { Button, Dropdown, Menu, Avatar, Space } from '@arco-design/web-react';
import { IconUser, IconPoweroff, IconSettings } from '@arco-design/web-react/icon';

interface NavigationProps {}

export default function Navigation({}: NavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, logout } = useAuth();

  const menuItems = [
    { href: '/customers', icon: '👤', label: '客户管理' },
    { href: '/users', icon: '👥', label: '用户管理' },
    { href: '/roles', icon: '🔐', label: '角色权限' },
    { href: '/menus', icon: '📋', label: '菜单管理' },
    { href: '/drivers', icon: '🚛', label: '司机管理' },
    { href: '/checkin', icon: '📅', label: '打卡记录' },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <Space>
          <IconUser />
          个人中心
        </Space>
      ),
    },
    {
      key: 'settings',
      label: (
        <Space>
          <IconSettings />
          系统设置
        </Space>
      ),
    },
    {
      key: 'logout',
      label: (
        <Space>
          <IconPoweroff />
          退出登录
        </Space>
      ),
    },
  ];

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'logout':
        logout();
        break;
      case 'profile':
        // 跳转到个人中心
        window.location.href = '/profile';
        break;
      case 'settings':
        // 跳转到系统设置
        window.location.href = '/settings';
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* 用户信息区域 */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #f0f0f0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Dropdown
          droplist={
            <Menu onClickMenuItem={handleMenuClick}>
              {userMenuItems.map((item: any) => (
                <Menu.Item key={item.key}>{item.label}</Menu.Item>
              ))}
            </Menu>
          }
          position="bottom"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
          }}>
            <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
              {user?.nickname?.[0] || user?.username?.[0] || 'U'}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.nickname || user?.username || '未知用户'}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.roles?.map(role => role.roleName).join(', ') || '管理员'}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>

      {/* 导航菜单 */}
      <div style={{ 
        flex: 1,
        padding: '12px 0',
        overflowY: 'auto'
      }}>
        {menuItems.map((item) => (
          <a 
            key={item.href}
            href={item.href} 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px', 
              color: '#374151', 
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              borderLeft: `3px solid ${hoveredItem === item.href ? '#1890ff' : 'transparent'}`,
              backgroundColor: hoveredItem === item.href ? '#f3f4f6' : 'transparent'
            }}
            onMouseEnter={() => setHoveredItem(item.href)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
} 