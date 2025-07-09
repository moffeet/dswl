const crypto = require('crypto');

/**
 * 生成签名
 * @param {Object} params 请求参数
 * @param {string} secretKey 签名密钥
 * @returns {string} 签名值
 */
function generateSignature(params, secretKey) {
  // 1. 过滤掉signature参数
  const filteredParams = { ...params };
  delete filteredParams.signature;

  // 2. 按参数名字典序排序
  const sortedKeys = Object.keys(filteredParams).sort();
  
  // 3. 拼接参数字符串
  const paramString = sortedKeys
    .map(key => {
      const value = filteredParams[key];
      if (value === null || value === undefined) {
        return `${key}=`;
      }
      if (typeof value === 'object') {
        return `${key}=${JSON.stringify(value)}`;
      }
      return `${key}=${value}`;
    })
    .join('&');

  console.log('参数字符串:', paramString);

  // 4. 生成签名
  return crypto
    .createHmac('sha256', secretKey)
    .update(paramString)
    .digest('hex');
}

/**
 * 生成随机nonce
 * @param {number} length 长度
 * @returns {string} 随机字符串
 */
function generateNonce(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 获取用户签名密钥（模拟后端逻辑）
 * @param {number} userId 用户ID
 * @returns {string} 签名密钥
 */
function getUserSignatureKey(userId) {
  const baseKey = 'miniprogram-signature-key-2024';
  return crypto
    .createHmac('sha256', baseKey)
    .update(`user_${userId}`)
    .digest('hex');
}

// 测试签名生成
console.log('=== 小程序接口签名校验测试 ===\n');

const userId = 1;
const secretKey = getUserSignatureKey(userId);
console.log('用户ID:', userId);
console.log('签名密钥:', secretKey);
console.log('');

// 测试客户搜索接口
const searchParams = {
  wxUserId: userId,
  customerNumber: 'C001',
  timestamp: Date.now().toString(),
  nonce: generateNonce()
};

searchParams.signature = generateSignature(searchParams, secretKey);

console.log('=== 客户搜索接口参数 ===');
console.log('参数:', JSON.stringify(searchParams, null, 2));
console.log('');

// 生成URL
const searchUrl = `http://localhost:3000/api/miniprogram/customers/search?${new URLSearchParams(searchParams).toString()}`;
console.log('请求URL:');
console.log(searchUrl);
console.log('');

// 测试客户更新接口
const updateParams = {
  wxUserId: userId,
  timestamp: Date.now().toString(),
  nonce: generateNonce(),
  operatorName: '张三',
  customerNumber: 'C001',
  storeAddress: '深圳市南山区科技园南区A座',
  warehouseAddress: '深圳市南山区科技园南区B座'
};

updateParams.signature = generateSignature(updateParams, secretKey);

console.log('=== 客户更新接口参数 ===');
console.log('参数:', JSON.stringify(updateParams, null, 2));
console.log('');

console.log('=== 测试说明 ===');
console.log('1. 复制上面的URL到浏览器或Postman中测试客户搜索接口');
console.log('2. 使用POST方法和上面的JSON参数测试客户更新接口');
console.log('3. 如果签名校验失败，会返回401错误');
console.log('4. 如果签名校验成功，会正常处理业务逻辑');
