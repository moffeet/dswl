'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 只有在确定未认证时才跳转，避免频繁跳转
    if (!isLoading && !isAuthenticated && !token) {
      console.log('未登录，跳转到登录页');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, token]);

  // 如果有token或用户信息，直接显示内容，不管验证状态
  if (token || user) {
    return <>{children}</>;
  }

  // 如果在初始加载中且完全没有认证信息，返回空白（避免闪烁）
  if (isLoading) {
    return null;
  }

  // 没有任何认证信息且不在加载中，返回空白等待跳转
  return null;
} 