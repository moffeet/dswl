# 📱 小程序双Token使用示例

## 🎯 概述

本文档介绍如何在小程序中使用双token机制，包括登录、token存储、自动刷新等完整流程。

## 🔐 双Token机制说明

- **Access Token**: 有效期2小时，用于日常API调用
- **Refresh Token**: 有效期7天，用于刷新Access Token
- **优势**: 提高安全性，减少重新登录频率

## 📝 完整实现示例

### 1. Token管理工具类

```javascript
// utils/tokenManager.js
class TokenManager {
  constructor() {
    this.accessToken = wx.getStorageSync('accessToken') || '';
    this.refreshToken = wx.getStorageSync('refreshToken') || '';
  }

  /**
   * 保存token
   */
  saveTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    wx.setStorageSync('accessToken', accessToken);
    wx.setStorageSync('refreshToken', refreshToken);
  }

  /**
   * 清除token
   */
  clearTokens() {
    this.accessToken = '';
    this.refreshToken = '';
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('refreshToken');
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return !!this.accessToken && !!this.refreshToken;
  }

  /**
   * 获取Access Token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * 获取Refresh Token
   */
  getRefreshToken() {
    return this.refreshToken;
  }
}

// 导出单例
export default new TokenManager();
```

### 2. 登录功能

```javascript
// utils/auth.js
import tokenManager from './tokenManager.js';

class AuthService {
  /**
   * 小程序登录
   */
  async login() {
    try {
      // 1. 获取手机号授权
      const phoneResult = await this.getPhoneNumber();
      
      // 2. 调用登录接口
      const loginResult = await this.callLoginAPI(phoneResult.code);
      
      // 3. 保存token
      tokenManager.saveTokens(
        loginResult.data.accessToken,
        loginResult.data.refreshToken
      );
      
      console.log('登录成功:', loginResult.data.user);
      return loginResult.data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 获取手机号授权
   */
  getPhoneNumber() {
    return new Promise((resolve, reject) => {
      wx.getPhoneNumber({
        success: resolve,
        fail: reject
      });
    });
  }

  /**
   * 调用登录API
   */
  callLoginAPI(code) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: '/api/miniprogram/login',
        method: 'POST',
        data: { code },
        success: (res) => {
          if (res.data.code === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message));
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 刷新Token
   */
  async refreshToken() {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('没有Refresh Token');
      }

      const result = await this.callRefreshAPI(refreshToken);
      
      // 保存新的token
      tokenManager.saveTokens(
        result.data.accessToken,
        result.data.refreshToken
      );
      
      console.log('Token刷新成功');
      return result.data;
    } catch (error) {
      console.error('Token刷新失败:', error);
      // 刷新失败，清除token并跳转登录
      tokenManager.clearTokens();
      throw error;
    }
  }

  /**
   * 调用刷新Token API
   */
  callRefreshAPI(refreshToken) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: '/api/miniprogram/refresh-token',
        method: 'POST',
        data: { refreshToken },
        success: (res) => {
          if (res.data.code === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message));
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 登出
   */
  logout() {
    tokenManager.clearTokens();
    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/login/login'
    });
  }
}

export default new AuthService();
```

### 3. HTTP请求拦截器

```javascript
// utils/request.js
import tokenManager from './tokenManager.js';
import authService from './auth.js';

class HttpClient {
  constructor() {
    this.baseURL = 'https://your-api-domain.com';
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  /**
   * 发送请求
   */
  async request(options) {
    // 添加Authorization头
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      options.header = options.header || {};
      options.header['Authorization'] = `Bearer ${accessToken}`;
    }

    // 添加完整URL
    options.url = this.baseURL + options.url;

    try {
      const result = await this.wxRequest(options);
      return result;
    } catch (error) {
      // 如果是401错误，尝试刷新token
      if (error.statusCode === 401 && !this.isRefreshing) {
        return this.handleTokenExpired(options);
      }
      throw error;
    }
  }

  /**
   * 处理Token过期
   */
  async handleTokenExpired(originalRequest) {
    if (this.isRefreshing) {
      // 如果正在刷新，将请求加入队列
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, request: originalRequest });
      });
    }

    this.isRefreshing = true;

    try {
      // 刷新token
      await authService.refreshToken();
      
      // 重新发送原始请求
      const accessToken = tokenManager.getAccessToken();
      originalRequest.header = originalRequest.header || {};
      originalRequest.header['Authorization'] = `Bearer ${accessToken}`;
      
      const result = await this.wxRequest(originalRequest);
      
      // 处理队列中的请求
      this.processQueue(null, accessToken);
      
      return result;
    } catch (error) {
      // 刷新失败，处理队列并跳转登录
      this.processQueue(error, null);
      authService.logout();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 处理请求队列
   */
  processQueue(error, token) {
    this.failedQueue.forEach(({ resolve, reject, request }) => {
      if (error) {
        reject(error);
      } else {
        request.header = request.header || {};
        request.header['Authorization'] = `Bearer ${token}`;
        this.wxRequest(request).then(resolve).catch(reject);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * 封装wx.request
   */
  wxRequest(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(res);
          }
        },
        fail: reject
      });
    });
  }

  // 便捷方法
  get(url, data = {}) {
    return this.request({
      url,
      method: 'GET',
      data
    });
  }

  post(url, data = {}) {
    return this.request({
      url,
      method: 'POST',
      data
    });
  }
}

export default new HttpClient();
```

### 4. 页面使用示例

```javascript
// pages/index/index.js
import authService from '../../utils/auth.js';
import httpClient from '../../utils/request.js';
import tokenManager from '../../utils/tokenManager.js';

Page({
  data: {
    userInfo: null,
    customers: []
  },

  onLoad() {
    this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    if (!tokenManager.isLoggedIn()) {
      // 未登录，跳转登录页
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }

    // 已登录，加载数据
    this.loadData();
  },

  /**
   * 加载数据
   */
  async loadData() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 调用API（自动处理token刷新）
      const result = await httpClient.get('/api/miniprogram/customers/search', {
        customerNumber: 'C001'
      });
      
      this.setData({
        customers: result.data
      });
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 登出
   */
  onLogout() {
    wx.showModal({
      title: '确认',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authService.logout();
        }
      }
    });
  }
});
```

## 🎯 最佳实践

1. **Token存储**: 使用wx.setStorageSync安全存储
2. **自动刷新**: 在HTTP拦截器中自动处理token过期
3. **错误处理**: 刷新失败时自动跳转登录页
4. **队列管理**: 避免并发刷新token的问题
5. **用户体验**: 刷新过程对用户透明

## 🔒 安全注意事项

1. 不要在控制台输出完整token
2. 定期清理过期的本地存储
3. 在应用退出时清除敏感数据
4. 监控异常登录行为
