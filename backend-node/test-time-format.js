/**
 * 时间格式化功能测试脚本
 * 
 * 使用方法：
 * 1. 启动后端服务：npm run start:dev
 * 2. 运行测试：node test-time-format.js
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const TEST_TOKEN = 'your-jwt-token-here'; // 需要替换为实际的JWT token

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * 测试时间格式化功能
 */
async function testTimeFormatting() {
  console.log('🕐 开始测试时间格式化功能...\n');

  try {
    // 测试1：默认格式（ISO格式）
    console.log('📋 测试1：默认格式（ISO格式）');
    const response1 = await api.get('/customers?page=1&limit=2');
    console.log('响应时间戳:', response1.data.timestamp);
    if (response1.data.data.list.length > 0) {
      console.log('数据时间字段:', response1.data.data.list[0].updatedAt);
    }
    console.log('');

    // 测试2：中文格式（通过请求参数）
    console.log('📋 测试2：中文格式（通过请求参数）');
    const response2 = await api.get('/customers?page=1&limit=2&formatTime=true&timeFormat=chinese');
    console.log('响应时间戳:', response2.data.timestamp);
    if (response2.data.data.list.length > 0) {
      console.log('数据时间字段:', response2.data.data.list[0].updatedAt);
    }
    console.log('');

    // 测试3：相对时间格式
    console.log('📋 测试3：相对时间格式');
    const response3 = await api.get('/customers?page=1&limit=2&formatTime=true&timeFormat=relative');
    console.log('响应时间戳:', response3.data.timestamp);
    if (response3.data.data.list.length > 0) {
      console.log('数据时间字段:', response3.data.data.list[0].updatedAt);
    }
    console.log('');

    // 测试4：通过请求头控制格式化
    console.log('📋 测试4：通过请求头控制格式化');
    const response4 = await api.get('/customers?page=1&limit=2', {
      headers: {
        'X-Format-Time': 'true',
        'X-Time-Format': 'chinese'
      }
    });
    console.log('响应时间戳:', response4.data.timestamp);
    if (response4.data.data.list.length > 0) {
      console.log('数据时间字段:', response4.data.data.list[0].updatedAt);
    }
    console.log('');

    // 测试5：装饰器自动格式化（客户列表已添加@ChineseTime装饰器）
    console.log('📋 测试5：装饰器自动格式化');
    const response5 = await api.get('/customers?page=1&limit=2');
    console.log('响应时间戳:', response5.data.timestamp);
    if (response5.data.data.list.length > 0) {
      console.log('数据时间字段:', response5.data.data.list[0].updatedAt);
    }
    console.log('');

    // 测试6：同步时间（相对时间格式）
    console.log('📋 测试6：同步时间（相对时间格式）');
    try {
      const response6 = await api.get('/customers/last-sync-time');
      console.log('同步时间响应:', JSON.stringify(response6.data, null, 2));
    } catch (error) {
      console.log('同步时间接口可能需要特定权限或数据');
    }
    console.log('');

    // 测试7：客户详情
    console.log('📋 测试7：客户详情（如果有数据）');
    if (response1.data.data.list.length > 0) {
      const customerId = response1.data.data.list[0].id;
      try {
        const response7 = await api.get(`/customers/${customerId}`);
        console.log('客户详情时间字段:', response7.data.data?.updatedAt);
      } catch (error) {
        console.log('获取客户详情失败，可能需要特定权限');
      }
    }

    console.log('✅ 时间格式化功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

/**
 * 测试时间格式化工具类（如果可以直接访问）
 */
function testDateFormatUtil() {
  console.log('\n🛠️ 测试时间格式化工具类...\n');

  const now = new Date();
  const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2小时前

  console.log('原始时间:', now.toISOString());
  console.log('2小时前:', pastTime.toISOString());
  
  // 模拟工具类功能
  console.log('中文格式:', now.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-'));

  // 相对时间计算
  const diffMs = now.getTime() - pastTime.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  console.log('相对时间:', `${diffHours}小时前`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 时间格式化功能测试开始\n');
  
  // 检查配置
  if (TEST_TOKEN === 'your-jwt-token-here') {
    console.log('⚠️  请先在脚本中设置有效的JWT token');
    console.log('   可以通过登录接口获取token，或者暂时跳过需要认证的测试\n');
  }

  // 测试工具类
  testDateFormatUtil();

  // 测试API接口
  await testTimeFormatting();

  console.log('\n📚 使用说明:');
  console.log('1. 装饰器方式: @ChineseTime() 或 @RelativeTime()');
  console.log('2. 请求参数: ?formatTime=true&timeFormat=chinese');
  console.log('3. 请求头: X-Format-Time: true');
  console.log('4. ResponseUtil: ResponseUtil.successWithTimeFormat(data, message, true)');
  console.log('5. 工具类: DateFormatUtil.formatDateTime(date)');
}

// 运行测试
main().catch(console.error);
