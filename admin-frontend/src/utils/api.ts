import { API_BASE_URL } from '@/config/api';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  responseType?: 'json' | 'blob';
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = `${API_BASE_URL}/api`) {
    this.baseURL = baseURL;
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, responseType = 'json' } = config;
    
    // 获取token
    const token = localStorage.getItem('token');
    
    // 设置默认headers
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 如果有token，添加到headers
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    // 合并headers
    const finalHeaders = { ...defaultHeaders, ...headers };
    
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      // 检查是否是401未授权
      if (response.status === 401) {
        // 如果是登录请求，不要清除token或跳转，而是返回具体的错误信息
        if (url.includes('/auth/login')) {
          const errorData = await response.json().catch(() => ({ message: '用户名或密码错误' }));
          throw new Error(errorData.message || '用户名或密码错误');
        }
        
        // 其他请求的401错误表示token过期，清除本地存储并跳转到登录页
        this.handleTokenExpired();
        throw new Error('登录已过期，请重新登录');
      }

      // 检查其他HTTP错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '请求失败' }));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      // 根据响应类型处理数据
      if (responseType === 'blob') {
        const blob = await response.blob();
        return { data: blob } as any;
      } else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  /**
   * 处理token过期
   */
  private handleTokenExpired() {
    // 只清除token，不再清除用户信息（因为用户信息存储在内存中）
    localStorage.removeItem('token');
    
    // 跳转到登录页
    window.location.href = '/login';
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, params?: Record<string, any> | { responseType?: 'json' | 'blob' }): Promise<ApiResponse<T>> {
    let finalUrl = url;
    let responseType: 'json' | 'blob' = 'json';

    if (params) {
      // 检查是否有responseType参数
      if ('responseType' in params) {
        responseType = params.responseType || 'json';
        // 从params中移除responseType，因为它不应该作为查询参数
        const { responseType: _, ...queryParams } = params;
        params = queryParams;
      }

      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return this.request<T>(finalUrl, { method: 'GET', responseType });
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body: data });
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body: data });
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PATCH', body: data });
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

// 创建默认的API客户端实例
const api = new ApiClient();

export default api;
export { ApiClient };
export type { ApiResponse }; 