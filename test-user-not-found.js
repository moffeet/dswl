// 测试小程序用户不存在时返回1001错误码
const axios = require('axios');

async function testUserNotFound() {
  try {
    console.log('🧪 测试小程序用户登录 - 用户不存在场景');
    
    // 模拟一个不存在的用户登录
    const response = await axios.post('http://localhost:3000/api/miniprogram/login', {
      code: 'fake_code_for_nonexistent_user'
    });
    
    console.log('📋 响应结果:');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 检查是否返回了正确的错误码
    if (response.data.code === 1001) {
      console.log('✅ 测试通过：返回了正确的错误码 1001');
    } else {
      console.log('❌ 测试失败：错误码不正确，期望 1001，实际', response.data.code);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('📋 错误响应:');
      console.log('状态码:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ 请求失败:', error.message);
    }
  }
}

// 运行测试
testUserNotFound();
