'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../app/context/auth';
import { usePermission } from '../app/context/permission';
import { Button, Dropdown, Menu, Avatar, Space, Alert } from '@arco-design/web-react';
import { IconUser, IconPoweroff, IconSettings, IconHome, IconUserGroup, IconLocation, IconFile, IconMobile, IconNav, IconLock, IconDown, IconRight } from '@arco-design/web-react/icon';

interface NavigationProps {}

export default function Navigation({}: NavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { permissionInfo, hasRole, isLoading } = usePermission();

  // 图标映射
  const iconMap: { [key: string]: React.ReactNode } = {
    'IconHome': <IconHome />,
    'IconUser': <IconUser />,
    'IconUserGroup': <IconUserGroup />,
    'IconLocation': <IconLocation />,
    'IconFileText': <IconFile />,
    'IconMobile': <IconMobile />,
    'IconMap': <IconNav />,
    'IconLock': <IconLock />,
  };

  // 切换子菜单展开状态
  const toggleSubmenu = (menuCode: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuCode)) {
      newExpanded.delete(menuCode);
    } else {
      newExpanded.add(menuCode);
    }
    setExpandedMenus(newExpanded);
  };

  // 渲染菜单项（支持子菜单）
  const renderMenuItem = (menu: any, level: number = 0) => {
    const isActive = pathname === menu.path;
    const isHovered = hoveredItem === menu.code;
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.code);
    const paddingLeft = 20 + (level * 16); // 根据层级调整缩进

    return (
      <div key={menu.code}>
        {/* 主菜单项 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: `14px ${paddingLeft}px`,
            color: isActive ? '#1890ff' : '#374151',
            fontSize: '14px',
            fontWeight: isActive ? '600' : '500',
            transition: 'all 0.2s ease',
            borderLeft: `3px solid ${isActive ? '#1890ff' : (isHovered ? '#1890ff' : 'transparent')}`,
            backgroundColor: isActive ? '#e6f7ff' : (isHovered ? '#f3f4f6' : 'transparent'),
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHoveredItem(menu.code)}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => {
            if (hasChildren) {
              toggleSubmenu(menu.code);
            } else {
              // 如果没有子菜单，使用客户端路由跳转
              console.log('🔗 导航到:', menu.path);
              router.push(menu.path);
            }
          }}
        >
          <span style={{ fontSize: '16px' }}>
            {iconMap[menu.icon || 'IconHome'] || '📄'}
          </span>
          <span style={{ flex: 1 }}>{menu.name}</span>
          {hasChildren && (
            <span style={{ fontSize: '12px', transition: 'transform 0.2s' }}>
              {isExpanded ? <IconDown /> : <IconRight />}
            </span>
          )}
        </div>

        {/* 子菜单 */}
        {hasChildren && isExpanded && (
          <div>
            {menu.children.map((child: any) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            加载菜单中...
          </div>
        ) : !hasRole ? (
          <div style={{ padding: '12px 20px' }}>
            <Alert
              type="warning"
              content="您还没有分配角色，只能访问首页。请联系管理员分配角色。"
              style={{ fontSize: '12px' }}
            />
          </div>
        ) : !permissionInfo?.menus || permissionInfo.menus.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            暂无可访问的菜单
          </div>
        ) : (
          permissionInfo.menus.map((menu) => renderMenuItem(menu))
        )}
      </div>
    </div>
  );
} 