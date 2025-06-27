'use client';

import { useState } from 'react';

interface NavigationProps {}

export default function Navigation({}: NavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { href: '/customers', icon: '👤', label: '客户管理' },
    { href: '/users', icon: '👥', label: '用户管理' },
    { href: '/roles', icon: '🔐', label: '角色权限' },
    { href: '/menus', icon: '📋', label: '菜单管理' },
    { href: '/drivers', icon: '🚛', label: '司机管理' },
    { href: '/checkin', icon: '📅', label: '打卡记录' },
  ];

  return (
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
  );
} 