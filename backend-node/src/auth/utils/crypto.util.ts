/**
 * 后端密码解密工具
 * 与前端加密逻辑对应
 */

// 与前端相同的密钥
const ENCRYPTION_KEY = 'logistics-frontend-2024-secure-key-v1';

/**
 * 解密前端加密的密码
 */
export function decryptPassword(encryptedData: string): {
  password: string;
  timestamp: number;
  nonce: string;
} {
  try {
    // 第一次Base64解码
    const firstDecoded = Buffer.from(encryptedData, 'base64').toString();
    
    // XOR解密
    const decrypted = firstDecoded
      .split('')
      .map((char, index) => {
        const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      })
      .join('');
    
    // 第二次Base64解码
    const jsonData = Buffer.from(decrypted, 'base64').toString();
    
    // 解析JSON数据
    const data = JSON.parse(jsonData);
    
    return {
      password: data.password,
      timestamp: data.timestamp,
      nonce: data.nonce
    };
  } catch (error) {
    console.error('密码解密失败:', error);
    throw new Error('密码解密失败');
  }
}

/**
 * 验证时间戳，防止重放攻击
 * @param timestamp 客户端时间戳
 * @param maxAgeMs 最大允许的时间差（毫秒）
 */
export function validateTimestamp(timestamp: number, maxAgeMs: number = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const age = now - timestamp;
  
  // 检查时间戳是否在合理范围内（5分钟内）
  return age >= 0 && age <= maxAgeMs;
}

/**
 * 生成数字签名（与前端逻辑一致）
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
 * 验证数据签名
 */
export function validateSignature(
  username: string,
  encryptedPassword: string,
  timestamp: number,
  signature: string
): boolean {
  const expectedSignature = generateSignature(`${username}${encryptedPassword}${timestamp}`);
  return expectedSignature === signature;
} 