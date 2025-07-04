interface JWTPayload {
  sub: number; // 用户ID
  username: string;
  nickname?: string;
  roles?: any[];
  userType?: string;
  exp: number; // 过期时间
  iat: number; // 签发时间
}

/**
 * 解析JWT token获取用户信息
 */
export function parseJWT(token: string): JWTPayload | null {
  try {
    // JWT由三部分组成，用.分隔：header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // 解析payload部分（第二部分）
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // 添加padding如果需要
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const paddedBase64 = base64 + padding;
    
    // 解码
    const jsonPayload = decodeURIComponent(
      window.atob(paddedBase64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const payload: JWTPayload = JSON.parse(jsonPayload);
    
    // 验证token是否过期
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    console.error('JWT解析失败:', error);
    return null;
  }
}

/**
 * 检查token是否即将过期（15分钟内）
 */
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = payload.exp - currentTime;
    
    // 如果剩余时间少于15分钟（900秒）
    return timeLeft < 900;
  } catch (error) {
    return true;
  }
}

/**
 * 从JWT payload转换为前端用户对象
 */
export function jwtToUser(payload: JWTPayload) {
  return {
    id: payload.sub,
    username: payload.username,
    nickname: payload.nickname,
    roles: payload.roles || [],
    userType: payload.userType
  };
} 