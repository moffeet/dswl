/**
 * 测试设备标识加密功能
 * 模拟前端加密逻辑
 */

// 与前端相同的密钥
const ENCRYPTION_KEY = 'logistics-frontend-2024-secure-key-v1';

/**
 * 加密设备标识（模拟前端逻辑）
 */
function encryptDeviceId(deviceId) {
  try {
    // 添加时间戳防重放攻击
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    
    // 组合数据（使用password字段存储设备ID）
    const data = {
      password: deviceId,
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
    console.error('设备标识加密出错:', error);
    throw new Error('设备标识加密失败');
  }
}

/**
 * 生成数字签名
 */
function generateSignature(data) {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 创建安全的小程序登录数据
 */
function createSecureMiniprogramLoginData(code, deviceId) {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(7);
  
  const loginData = {
    code,
    timestamp,
    nonce
  };

  // 如果提供了设备标识，进行加密
  if (deviceId) {
    loginData.deviceId = encryptDeviceId(deviceId);
    
    // 生成签名（包含加密后的设备标识）
    const signatureData = `${code}${loginData.deviceId}${timestamp}${nonce}`;
    loginData.signature = generateSignature(signatureData);
  }

  return loginData;
}

// 测试加密功能
async function testEncryption() {
  console.log('🧪 开始测试设备标识加密功能...\n');

  // 1. 测试明文模式
  console.log('📝 测试1: 明文模式');
  const plainData = {
    code: 'test_phone_code_456',
    deviceId: 'device_test_plain_12345'
  };
  console.log('请求数据:', JSON.stringify(plainData, null, 2));

  try {
    const response1 = await fetch('http://localhost:3000/api/miniprogram/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    });
    const result1 = await response1.json();
    console.log('响应结果:', result1.code, result1.message);
    console.log('✅ 明文模式测试完成\n');
  } catch (error) {
    console.error('❌ 明文模式测试失败:', error.message);
  }

  // 2. 重置设备绑定
  console.log('🔄 重置设备绑定...');
  // 这里需要手动重置，或者调用管理员API

  // 3. 测试加密模式
  console.log('🔐 测试2: 加密模式');
  const encryptedData = createSecureMiniprogramLoginData('test_phone_code_456', 'device_test_encrypted_67890');
  console.log('加密请求数据:', JSON.stringify(encryptedData, null, 2));
  console.log('设备标识长度:', encryptedData.deviceId.length);

  try {
    const response2 = await fetch('http://localhost:3000/api/miniprogram/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encryptedData)
    });
    const result2 = await response2.json();
    console.log('响应结果:', result2.code, result2.message);
    console.log('✅ 加密模式测试完成\n');
  } catch (error) {
    console.error('❌ 加密模式测试失败:', error.message);
  }

  console.log('🎉 所有测试完成！');
}

// 如果是直接运行此脚本
if (require.main === module) {
  // 检查是否有fetch函数（Node.js 18+）
  if (typeof fetch === 'undefined') {
    console.log('❌ 需要Node.js 18+或安装node-fetch包');
    console.log('💡 手动测试命令:');
    
    // 生成测试数据
    const testDeviceId = 'device_test_encrypted_67890';
    const encryptedData = createSecureMiniprogramLoginData('test_phone_code_456', testDeviceId);
    
    console.log('\n🔐 加密登录测试命令:');
    console.log(`curl -X POST "http://localhost:3000/api/miniprogram/login" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '${JSON.stringify(encryptedData)}'`);
    
    console.log('\n📝 明文登录测试命令:');
    console.log(`curl -X POST "http://localhost:3000/api/miniprogram/login" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"code":"test_phone_code_456","deviceId":"device_test_plain_12345"}'`);
  } else {
    testEncryption();
  }
}

module.exports = {
  encryptDeviceId,
  generateSignature,
  createSecureMiniprogramLoginData
};
