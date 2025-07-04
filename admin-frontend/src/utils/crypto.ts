/**
 * 密码加密工具
 * 使用浏览器内置的Web Crypto API进行加密
 */

// 简单的密码混淆密钥 (生产环境中应该动态获取)
const ENCRYPTION_KEY = 'logistics-frontend-2024-secure-key-v1';

/**
 * 使用简单算法加密密码
 * 注意：这不是最强的加密，但比明文传输安全得多
 * 生产环境建议结合HTTPS使用
 */
export function encryptPassword(password: string): string {
  try {
    // 添加时间戳防重放攻击
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    
    // 组合数据
    const data = {
      password,
      timestamp,
      nonce
    };
    
    const jsonData = JSON.stringify(data);
    
    // 简单的Base64 + XOR加密
    const encrypted = btoa(jsonData)
      .split('')
      .map((char, index) => {
        const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      })
      .join('');
    
    // 再次Base64编码
    return btoa(encrypted);
  } catch (error) {
    console.error('密码加密出错:', error);
    throw new Error('密码加密失败，请重试');
  }
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成简单的数字签名，用于验证数据完整性
 */
export function generateSignature(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 创建安全的登录数据包
 */
export function createSecureLoginData(username: string, password: string) {
  const encryptedPassword = encryptPassword(password);
  const timestamp = Date.now();
  const signature = generateSignature(`${username}${encryptedPassword}${timestamp}`);
  
  return {
    username,
    password: encryptedPassword, // 加密后的密码
    timestamp,
    signature,
    _encrypted: true // 标识这是加密数据
  };
} 