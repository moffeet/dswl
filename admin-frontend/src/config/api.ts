// API配置 - 智能环境检测
const getBaseURL = () => {
  // 如果是浏览器环境，检测当前host
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // 服务器环境：检测服务器IP
    if (hostname === '49.235.60.148') {
      return `${protocol}//${hostname}:3000`;
    }
    
    // 本地开发环境
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3000`;
    }
    
    // 其他情况，可能是其他服务器环境
    return `${protocol}//${hostname}:3000`;
  }
  
  // 服务端渲染时的默认配置
  // 根据NODE_ENV判断
  return process.env.NODE_ENV === 'production' 
    ? 'http://49.235.60.148:3000'
    : 'http://localhost:3000';
};

export const API_BASE_URL = getBaseURL();

console.log('🔧 API配置加载:', {
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  timestamp: new Date().toISOString()
});

// API端点 - 统一使用 /api 前缀
export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    profile: `${API_BASE_URL}/api/auth/profile`,
  },
  users: `${API_BASE_URL}/api/users`,
  roles: `${API_BASE_URL}/api/roles`,
  permissions: `${API_BASE_URL}/api/permissions`,
  customers: `${API_BASE_URL}/api/customers`,
};

// 高德地图API配置
export const AMAP_CONFIG = {
  key: '93c42594b5b8b8b8b8b8b8b8b8b8b8b8', // 这里应该使用实际的高德地图API密钥
  baseUrl: 'https://restapi.amap.com/v3',
  endpoints: {
    geocode: '/geocode/geo', // 地理编码
    reverseGeocode: '/geocode/regeo', // 逆地理编码
  }
};

// 获取认证头的工具函数
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

// 创建API实例
export const api = {
  get: async (url: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    return response.json();
  },

  post: async (url: string, data?: any, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response.json();
  },

  put: async (url: string, data?: any, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response.json();
  },

  delete: async (url: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    return response.json();
  },
};