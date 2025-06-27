'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth';
import { Spin } from '@arco-design/web-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute状态:', { isLoading, isAuthenticated, hasUser: !!user, hasToken: !!token });
    
    if (!isLoading && !isAuthenticated) {
      console.log('未登录，跳转到登录页');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, user, token]);

  // 显示加载状态
  if (isLoading) {
    console.log('正在检查登录状态...');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <Spin size={40} />
        <div style={{ marginLeft: '12px', color: '#666' }}>
          正在验证登录状态...
        </div>
      </div>
    );
  }

  // 未登录时不显示内容
  if (!isAuthenticated) {
    console.log('未认证，不显示内容');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <Spin size={40} />
        <div style={{ marginLeft: '12px', color: '#666' }}>
          正在跳转到登录页...
        </div>
      </div>
    );
  }

  console.log('已认证，显示受保护内容');
  return <>{children}</>;
} 