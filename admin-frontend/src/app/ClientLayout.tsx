'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from '../components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        backgroundColor: '#f5f5f5',
        overflow: 'hidden'
      }}>
        {/* 侧边栏 - 固定宽度 */}
        <div style={{ 
          width: '240px', 
          minWidth: '240px',
          flexShrink: 0,
          backgroundColor: '#fff', 
          borderRight: '1px solid #e5e7eb',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10
        }}>
          {/* 系统标题 */}
          <div style={{ 
            padding: '20px 16px', 
            borderBottom: '1px solid #e5e7eb', 
            color: '#1890ff', 
            fontSize: '18px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fafbfc'
          }}>
            🎯 物流管理系统
          </div>
          
          {/* 导航菜单 */}
          <Navigation />
        </div>

        {/* 右侧主要内容区域 */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden'
        }}>
          {/* 顶部栏 */}
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '0 24px', 
            borderBottom: '1px solid #e5e7eb', 
            height: 64, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            flexShrink: 0,
            zIndex: 5
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              <span>🏠</span>
              <span>/</span>
              <span>管理后台</span>
            </div>
          </div>

          {/* 主内容区域 */}
          <div style={{ 
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#f9fafb'
          }}>
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 