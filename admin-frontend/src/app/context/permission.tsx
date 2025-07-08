'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import { api } from '../../config/api';

interface Role {
  id: number;
  roleName: string;
  roleCode: string;
  description?: string;
  status: string;
}

interface Menu {
  name: string;
  path: string;
  code: string;
  icon?: string;
  sortOrder: number;
}

interface PermissionInfo {
  hasRole: boolean;
  roles: Role[];
  permissions: string[];
  menus: Menu[];
}

interface PermissionContextType {
  permissionInfo: PermissionInfo | null;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
  canAccessPage: (path: string) => boolean;
  canPerformAction: (actionCode: string) => boolean;
  hasRole: boolean;
  isAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function usePermission() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
}

interface PermissionProviderProps {
  children: React.ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const [permissionInfo, setPermissionInfo] = useState<PermissionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user, isAuthenticated } = useAuth();

  // 获取用户权限信息
  const fetchPermissions = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setPermissionInfo(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/auth/permissions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.code === 200) {
        setPermissionInfo(response.data);
      } else {
        console.error('获取权限信息失败:', response.message);
        setPermissionInfo(null);
      }
    } catch (error) {
      console.error('获取权限信息出错:', error);
      setPermissionInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  // 刷新权限信息
  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    await fetchPermissions();
  }, [fetchPermissions]);

  // 检查是否可以访问指定页面
  const canAccessPage = useCallback((path: string): boolean => {
    if (!permissionInfo) {
      return false;
    }

    // 如果没有角色，只能访问home页面
    if (!permissionInfo.hasRole) {
      return path === '/' || path === '/home' || path === '';
    }

    // home页面所有用户都可以访问
    if (path === '/' || path === '/home' || path === '') {
      return true;
    }

    // 检查菜单权限
    return permissionInfo.menus.some(menu => menu.path === path);
  }, [permissionInfo]);

  // 检查是否可以执行指定操作
  const canPerformAction = useCallback((actionCode: string): boolean => {
    if (!permissionInfo) {
      return false;
    }
    return permissionInfo.permissions.includes(actionCode);
  }, [permissionInfo]);

  // 检查是否有角色
  const hasRole = permissionInfo?.hasRole || false;

  // 检查是否为管理员
  const isAdmin = permissionInfo?.roles?.some(role => role.roleCode === 'admin') || false;

  // 当认证状态变化时，重新获取权限信息
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const value: PermissionContextType = {
    permissionInfo,
    isLoading,
    refreshPermissions,
    canAccessPage,
    canPerformAction,
    hasRole,
    isAdmin,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
