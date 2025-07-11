import { useState, useEffect } from 'react';

interface UserPermissions {
  hasRole: boolean;
  roles: any[];
  permissions: string[];
  menus: any[];
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions>({
    hasRole: false,
    roles: [],
    permissions: [],
    menus: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 200) {
          setPermissions(result.data);
        }
      }
    } catch (error) {
      console.error('获取权限失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 检查是否有指定权限
  const hasPermission = (permissionCode: string): boolean => {
    return permissions.permissions.includes(permissionCode);
  };

  // 检查是否有按钮权限
  const hasButtonPermission = (buttonCode: string): boolean => {
    return hasPermission(buttonCode);
  };

  // 检查是否有菜单权限
  const hasMenuPermission = (menuCode: string): boolean => {
    return hasPermission(menuCode);
  };

  // 检查是否为超级管理员
  const isAdmin = (): boolean => {
    return permissions.roles.some(role => role.roleCode === 'admin');
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasButtonPermission,
    hasMenuPermission,
    isAdmin,
    refetch: fetchPermissions
  };
};
