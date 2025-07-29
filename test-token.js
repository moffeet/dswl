const jwt = require('jsonwebtoken');

// JWT密钥（与后端配置一致）
const JWT_SECRET = process.env.JWT_SECRET || 'logistics-system-jwt-secret-2024';

// 创建一个有效的token（2小时有效期）
const validPayload = {
  sub: 1,
  username: '张三',
  phone: '13800138001',
  role: '司机',
  userType: 'wx-user',
  type: 'access',
  deviceId: 'test_device_123'
};

const validToken = jwt.sign(validPayload, JWT_SECRET, { expiresIn: '2h' });
console.log('有效Token (2小时):', validToken);

// 创建一个短期过期的token（1秒后过期）
const expiredPayload = {
  sub: 1,
  username: '张三',
  phone: '13800138001',
  role: '司机',
  userType: 'wx-user',
  type: 'access',
  deviceId: 'test_device_123'
};

const expiredToken = jwt.sign(expiredPayload, JWT_SECRET, { expiresIn: '1s' });
console.log('短期Token (1秒后过期):', expiredToken);

// 创建一个格式错误的token
const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_payload.invalid_signature';
console.log('格式错误Token:', malformedToken);

// 创建一个签名错误的token
const wrongSignatureToken = jwt.sign(validPayload, 'wrong_secret', { expiresIn: '2h' });
console.log('签名错误Token:', wrongSignatureToken);

console.log('\n=== 测试命令 ===');
console.log('1. 测试有效Token:');
console.log(`curl -s -w "\\nHTTP Status: %{http_code}\\n" -H "Authorization: Bearer ${validToken}" "http://localhost:3000/api/miniprogram/customers"`);

console.log('\n2. 测试过期Token (等待2秒后执行):');
console.log(`curl -s -w "\\nHTTP Status: %{http_code}\\n" -H "Authorization: Bearer ${expiredToken}" "http://localhost:3000/api/miniprogram/customers"`);

console.log('\n3. 测试格式错误Token:');
console.log(`curl -s -w "\\nHTTP Status: %{http_code}\\n" -H "Authorization: Bearer ${malformedToken}" "http://localhost:3000/api/miniprogram/customers"`);

console.log('\n4. 测试签名错误Token:');
console.log(`curl -s -w "\\nHTTP Status: %{http_code}\\n" -H "Authorization: Bearer ${wrongSignatureToken}" "http://localhost:3000/api/miniprogram/customers"`);
