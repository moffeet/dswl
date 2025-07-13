/**
 * 测试密码修改功能的加密传输
 */

// 模拟前端加密逻辑
const ENCRYPTION_KEY = 'logistics-frontend-2024-secure-key-v1';

function encryptPassword(password) {
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
    const encrypted = Buffer.from(jsonData)
      .toString('base64')
      .split('')
      .map((char, index) => {
        const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      })
      .join('');
    
    // 再次Base64编码
    return Buffer.from(encrypted).toString('base64');
  } catch (error) {
    console.error('密码加密出错:', error);
    throw new Error('密码加密失败，请重试');
  }
}

function generateSignature(data) {
  // 简单的签名生成（实际应用中应该使用更强的算法）
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data + ENCRYPTION_KEY).digest('hex');
}

function createSecureLoginData(username, password) {
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

// 测试密码修改
async function testPasswordChange() {
  const testUserId = 1;
  const testPassword = 'test123456';
  
  console.log('=== 测试密码修改加密传输 ===');
  console.log('原始密码:', testPassword);
  
  // 创建加密数据
  const secureData = createSecureLoginData('', testPassword);
  
  const requestData = {
    userId: testUserId,
    newPassword: secureData.password,
    timestamp: secureData.timestamp,
    signature: secureData.signature,
    _encrypted: true
  };
  
  console.log('加密后的请求数据:', {
    userId: requestData.userId,
    passwordLength: requestData.newPassword.length,
    hasTimestamp: !!requestData.timestamp,
    hasSignature: !!requestData.signature,
    isEncrypted: requestData._encrypted
  });
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：实际使用时需要添加Authorization header
        // 'Authorization': 'Bearer your-jwt-token'
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    console.log('服务器响应:', result);
    
    if (result.code === 200) {
      console.log('✅ 密码修改成功！');
    } else {
      console.log('❌ 密码修改失败:', result.message);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  testPasswordChange();
}

module.exports = {
  encryptPassword,
  createSecureLoginData,
  testPasswordChange
};
