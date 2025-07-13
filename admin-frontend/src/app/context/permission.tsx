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
  children?: Menu[];
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
    console.log('🔍 检查页面权限:', path);
    console.log('📋 权限信息:', permissionInfo);

    if (!permissionInfo) {
      console.log('❌ 没有权限信息');
      return false;
    }

    // 🔥 超级管理员绕过所有权限检查 - 解决权限命名变更和新增权限的问题
    const isAdmin = permissionInfo.roles?.some(role => role.roleCode === 'admin');
    if (isAdmin) {
      console.log('✅ 超级管理员，绕过权限检查，允许访问所有页面');
      return true;
    }

    // 如果没有角色，只能访问home页面
    if (!permissionInfo.hasRole) {
      console.log('❌ 用户没有角色');
      return path === '/' || path === '/home' || path === '';
    }

    // home页面所有用户都可以访问
    if (path === '/' || path === '/home' || path === '') {
      console.log('✅ 首页，允许访问');
      return true;
    }

    // 递归检查菜单权限（包括子菜单）
    const checkMenuAccess = (menus: Menu[]): boolean => {
      for (const menu of menus) {
        console.log(`🔍 检查菜单: ${menu.name} (${menu.path}) vs ${path}`);
        if (menu.path === path) {
          console.log('✅ 找到匹配的菜单路径');
          return true;
        }
        if (menu.children && checkMenuAccess(menu.children)) {
          return true;
        }
      }
      return false;
    };

    const hasAccess = checkMenuAccess(permissionInfo.menus);
    console.log(`🎯 最终权限检查结果: ${hasAccess}`);
    return hasAccess;
  }, [permissionInfo]);

  // 检查是否可以执行指定操作
  const canPerformAction = useCallback((actionCode: string): boolean => {
    if (!permissionInfo) {
      return false;
    }

    // 🔥 超级管理员绕过所有权限检查 - 解决权限命名变更和新增权限的问题
    const isAdmin = permissionInfo.roles?.some(role => role.roleCode === 'admin');
    if (isAdmin) {
      return true;
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
