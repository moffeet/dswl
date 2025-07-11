'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermission } from '../context/permission';
import { Result, Button } from '@arco-design/web-react';
import { IconLock } from '@arco-design/web-react/icon';

interface PagePermissionGuardProps {
  children: React.ReactNode;
}

export default function PagePermissionGuard({ children }: PagePermissionGuardProps) {
  const { canAccessPage, hasRole, isLoading, permissionInfo } = usePermission();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('🛡️ PagePermissionGuard 检查:', {
      pathname,
      isLoading,
      hasRole,
      permissionInfo
    });

    // 如果正在加载权限信息，不做任何处理
    if (isLoading) {
      console.log('⏳ 权限信息加载中...');
      return;
    }

    // 如果没有角色且不是首页，跳转到首页
    if (!hasRole && pathname !== '/' && pathname !== '/home') {
      console.log('❌ 用户没有角色，跳转到首页');
      router.push('/');
      return;
    }

    // 如果有角色但没有权限访问当前页面，跳转到首页
    if (hasRole && !canAccessPage(pathname)) {
      console.log('❌ 用户没有权限访问当前页面，跳转到首页');
      router.push('/');
      return;
    }

    console.log('✅ 权限检查通过，允许访问页面');
  }, [isLoading, hasRole, pathname, canAccessPage, router, permissionInfo]);

  // 如果正在加载权限信息，显示加载状态
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#666' }}>正在验证权限...</div>
        </div>
      </div>
    );
  }

  // 如果没有角色且不是首页，显示权限不足页面
  if (!hasRole && pathname !== '/' && pathname !== '/home') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <Result
          status="403"
          title="权限不足"
          subTitle="您还没有分配角色，只能访问首页。请联系管理员分配角色。"
          extra={[
            <Button key="home" type="primary" onClick={() => router.push('/')}>
              返回首页
            </Button>
          ]}
        />
      </div>
    );
  }

  // 如果有角色但没有权限访问当前页面，显示权限不足页面
  if (hasRole && !canAccessPage(pathname)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <Result
          status="403"
          title="访问被拒绝"
          subTitle="您没有权限访问此页面。"
          extra={[
            <Button key="home" type="primary" onClick={() => router.push('/')}>
              返回首页
            </Button>
          ]}
        />
      </div>
    );
  }

  // 有权限访问，显示页面内容
  return <>{children}</>;
}
