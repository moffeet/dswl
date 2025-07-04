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