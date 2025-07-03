// API配置
export const API_BASE_URL = 'http://49.235.60.148:3000';

// API端点
export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    logout: `${API_BASE_URL}/auth/logout`,
    profile: `${API_BASE_URL}/auth/profile`,
  },
  users: `${API_BASE_URL}/users`,
  roles: `${API_BASE_URL}/roles`,
  permissions: `${API_BASE_URL}/permissions`,
  customers: `${API_BASE_URL}/api/customers`,
}; 