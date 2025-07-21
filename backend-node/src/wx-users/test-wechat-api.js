/**
 * 微信API测试脚本
 * 用于测试微信小程序API调用是否正常
 */

const axios = require('axios');

// 微信小程序配置（请替换为实际的AppID和AppSecret）
const WECHAT_CONFIG = {
  appId: 'your_wechat_appid_here',
  appSecret: 'your_wechat_app_secret_here'
};

/**
 * 测试获取access_token
 */
async function testGetAccessToken() {
  console.log('🔑 测试获取access_token...');
  
  const url = 'https://api.weixin.qq.com/cgi-bin/token';
  const params = {
    grant_type: 'client_credential',
    appid: WECHAT_CONFIG.appId,
    secret: WECHAT_CONFIG.appSecret
  };

  try {
    const response = await axios.get(url, { params });
    console.log('✅ access_token获取成功:', response.data);
    return response.data.access_token;
  } catch (error) {
    console.error('❌ access_token获取失败:', error.message);
    return null;
  }
}

/**
 * 测试通过jsCode获取openid
 */
async function testGetOpenId(jsCode) {
  console.log('🆔 测试获取openid...');
  
  const url = 'https://api.weixin.qq.com/sns/jscode2session';
  const params = {
    appid: WECHAT_CONFIG.appId,
    secret: WECHAT_CONFIG.appSecret,
    js_code: jsCode,
    grant_type: 'authorization_code'
  };

  try {
    const response = await axios.get(url, { params });
    console.log('✅ openid获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ openid获取失败:', error.message);
    return null;
  }
}

/**
 * 测试通过code获取手机号
 */
async function testGetPhoneNumber(accessToken, code) {
  console.log('📱 测试获取手机号...');
  
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
  const data = { code };

  try {
    const response = await axios.post(url, data);
    console.log('✅ 手机号获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 手机号获取失败:', error.message);
    return null;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始微信API测试...\n');

  // 检查配置
  if (WECHAT_CONFIG.appId === 'your_wechat_appid_here') {
    console.error('❌ 请先配置正确的微信小程序AppID和AppSecret');
    return;
  }

  // 1. 测试获取access_token
  const accessToken = await testGetAccessToken();
  if (!accessToken) {
    console.error('❌ 无法获取access_token，后续测试无法进行');
    return;
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 2. 测试获取openid（需要真实的jsCode）
  console.log('⚠️  测试获取openid需要真实的jsCode，请从小程序端获取');
  console.log('   可以在小程序中调用wx.login()获取code后替换下面的测试代码\n');
  
  // 示例jsCode（无效，仅用于演示）
  const testJsCode = 'test_js_code_from_miniprogram';
  await testGetOpenId(testJsCode);

  console.log('\n' + '='.repeat(50) + '\n');

  // 3. 测试获取手机号（需要真实的手机号授权code）
  console.log('⚠️  测试获取手机号需要真实的授权code，请从小程序端获取');
  console.log('   可以在小程序中通过button open-type="getPhoneNumber"获取code\n');
  
  // 示例手机号code（无效，仅用于演示）
  const testPhoneCode = 'test_phone_code_from_miniprogram';
  await testGetPhoneNumber(accessToken, testPhoneCode);

  console.log('\n🎉 测试完成！');
  console.log('\n📝 使用说明：');
  console.log('1. 请先在微信公众平台获取正确的AppID和AppSecret');
  console.log('2. 在小程序端获取真实的jsCode和手机号授权code进行测试');
  console.log('3. 确保服务器域名已在微信公众平台配置白名单');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGetAccessToken,
  testGetOpenId,
  testGetPhoneNumber
};
