'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';
import { parseJWT, jwtToUser, isTokenExpiringSoon } from '../../utils/jwt';

interface User {
  id: number;
  username: string;
  nickname?: string;
  status?: string;
  roles?: any[];
  avatar?: string;
  phone?: string;
  email?: string;
  lastLoginTime?: string;
  lastLoginIp?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUserInfo: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoadingUserInfo: boolean; // 区分初始加载和用户信息加载
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 初始加载状态
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false); // 用户信息加载状态
  const router = useRouter();

  // 从服务器获取完整用户信息
  const fetchUserProfile = useCallback(async (currentToken: string): Promise<User | null> => {
    try {
      setIsLoadingUserInfo(true);
      const result = await api.get('/auth/profile');
      
      if (result.code === 200 && result.data) {
        return result.data;
      } else {
        console.error('获取用户信息失败:', result.message);
        return null;
      }
    } catch (error: any) {
      console.error('获取用户信息出错:', error);
      // 如果是401错误，说明token无效
      if (error.message?.includes('401') || error.message?.includes('登录已过期')) {
        return null;
      }
      // 其他错误不清除用户信息，可能是网络问题
      return null;
    } finally {
      setIsLoadingUserInfo(false);
    }
  }, []);

  // 刷新用户信息
  const refreshUserInfo = useCallback(async () => {
    if (!token) return;
    
    const fullUserInfo = await fetchUserProfile(token);
    if (fullUserInfo) {
      setUser(fullUserInfo);
    } else {
      // 获取失败，可能token无效，清除认证状态
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [token, fetchUserProfile, router]);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        // 没有token，立即结束loading
        setIsLoading(false);
        return;
      }

      // 第一步：解析JWT token获取基本用户信息（快速显示）
      const jwtPayload = parseJWT(storedToken);
      if (!jwtPayload) {
        // JWT解析失败，token无效，立即清理并结束loading
        localStorage.removeItem('token');
        setIsLoading(false);
        return;
      }

      // 立即设置token和基本用户信息，并结束loading状态
      setToken(storedToken);
      const basicUserInfo = jwtToUser(jwtPayload);
      setUser(basicUserInfo);
      setIsLoading(false); // 立即结束loading，让页面显示
      
      console.log('JWT解析成功，立即显示页面，基本用户信息:', basicUserInfo);

      // 第二步：在后台从服务器获取完整用户信息（不影响页面显示）
      try {
        const fullUserInfo = await fetchUserProfile(storedToken);
        if (fullUserInfo) {
          setUser(fullUserInfo);
          console.log('后台验证成功，更新完整用户信息:', fullUserInfo);
        } else {
          // 服务器验证失败，清除认证状态
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          console.log('后台验证失败，清除认证状态');
        }
      } catch (backgroundError) {
        // 后台验证失败不影响当前页面显示，只记录日志
        console.warn('后台验证出错，但不影响当前会话:', backgroundError);
      }
    };

    initAuth();
  }, [fetchUserProfile]);

  // 定期检查token有效性
  useEffect(() => {
    if (!token) return;

    const checkTokenValidity = () => {
      // 检查token是否即将过期
      if (isTokenExpiringSoon(token)) {
        console.log('Token即将过期，建议刷新');
        // 可以在这里实现token刷新逻辑
        // 或者提示用户重新登录
      }
    };

    // 立即检查一次
    checkTokenValidity();

    // 每5分钟检查一次
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  const login = useCallback(async (newToken: string) => {
    try {
      // 第一步：解析JWT获取基本信息
      const jwtPayload = parseJWT(newToken);
      if (!jwtPayload) {
        throw new Error('无效的登录token');
      }

      // 立即设置token和基本用户信息
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      const basicUserInfo = jwtToUser(jwtPayload);
      setUser(basicUserInfo);

      // 第二步：获取完整用户信息
      const fullUserInfo = await fetchUserProfile(newToken);
      if (fullUserInfo) {
        setUser(fullUserInfo);
      }
      // 注意：即使获取完整信息失败，也不影响登录，因为基本信息已经足够
    } catch (error: any) {
      console.error('登录处理失败:', error);
      throw error;
    }
  }, [fetchUserProfile]);

  // 使用useCallback包装logout函数，避免依赖问题
  const logout = useCallback(async () => {
    try {
      // 调用后端登出接口
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error: any) {
      console.error('登出请求失败:', error);
    } finally {
      // 清理本地状态
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      // 注意：不再清除localStorage中的user，因为我们只存储token
      router.push('/login');
    }
  }, [token, router]);

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    refreshUserInfo,
    isLoading,
    isAuthenticated: !!user && !!token,
    isLoadingUserInfo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 