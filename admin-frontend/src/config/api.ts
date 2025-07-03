// API配置 - 根据环境自动切换
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://49.235.60.148:3000' 
  : 'http://localhost:3000';

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