/**
 * 全系统时间格式化测试脚本
 * 
 * 测试所有已修改的接口，验证时间格式化是否正常工作
 * 
 * 使用方法：
 * 1. 启动后端服务：npm run start:dev
 * 2. 运行测试：node test-all-time-format.js
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
  },
  timeout: 10000
});

/**
 * 测试接口列表
 */
const testCases = [
  // 客户管理模块
  { name: '客户列表', url: '/customers?page=1&limit=2', method: 'GET', expectedFormat: 'chinese' },
  { name: '客户搜索', url: '/customers/search?customerName=测试', method: 'GET', expectedFormat: 'chinese' },
  { name: '同步时间', url: '/customers/last-sync-time', method: 'GET', expectedFormat: 'relative' },
  { name: '同步元数据', url: '/customers/sync-metadata', method: 'GET', expectedFormat: 'relative' },
  
  // 用户管理模块
  { name: '用户列表', url: '/users?page=1&limit=2', method: 'GET', expectedFormat: 'chinese' },
  
  // 角色管理模块
  { name: '角色列表', url: '/roles?page=1&limit=2', method: 'GET', expectedFormat: 'chinese' },
  
  // 权限管理模块
  { name: '权限列表', url: '/permissions?page=1&limit=2', method: 'GET', expectedFormat: 'chinese' },
  
  // 小程序用户模块
  { name: '小程序用户列表', url: '/wx-users?page=1&limit=2', method: 'GET', expectedFormat: 'chinese' },
  
  // 签收单管理模块
  { name: '签收单列表', url: '/receipts?page=1&limit=2', method: 'GET', expectedFormat: 'chinese' },
  
  // 认证模块
  { name: '用户资料', url: '/auth/profile', method: 'GET', expectedFormat: 'relative' },
  
  // 定时任务模块
  { name: '任务状态', url: '/tasks/status', method: 'GET', expectedFormat: 'relative' },
  
  // 通用模块
  { name: '健康检查', url: '/health', method: 'GET', expectedFormat: 'relative', noAuth: true },
  { name: '系统信息', url: '/info', method: 'GET', expectedFormat: 'relative', noAuth: true },
  
  // 日志管理
  { name: '日志状态', url: '/logs/status', method: 'GET', expectedFormat: 'relative' },
];

/**
 * 检查时间格式
 */
function checkTimeFormat(timeStr, expectedFormat) {
  if (!timeStr) return { valid: false, reason: '时间字段为空' };
  
  switch (expectedFormat) {
    case 'chinese':
      // 中文格式：2025-07-11 12:11:01
      const chinesePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
      return {
        valid: chinesePattern.test(timeStr),
        reason: chinesePattern.test(timeStr) ? '格式正确' : '不是中文时间格式'
      };
      
    case 'relative':
      // 相对时间：刚刚、5分钟前、2小时前等
      const relativePatterns = [
        /^刚刚$/,
        /^\d+秒前$/,
        /^\d+分钟前$/,
        /^\d+小时前$/,
        /^\d+天前$/,
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/ // 超过一周的显示完整时间
      ];
      const isRelative = relativePatterns.some(pattern => pattern.test(timeStr));
      return {
        valid: isRelative,
        reason: isRelative ? '格式正确' : '不是相对时间格式'
      };
      
    default:
      return { valid: false, reason: '未知的期望格式' };
  }
}

/**
 * 测试单个接口
 */
async function testSingleAPI(testCase) {
  try {
    console.log(`\n📋 测试: ${testCase.name}`);
    console.log(`   URL: ${testCase.method} ${testCase.url}`);
    console.log(`   期望格式: ${testCase.expectedFormat}`);
    
    // 创建请求配置
    const config = {
      method: testCase.method.toLowerCase(),
      url: testCase.url
    };
    
    // 如果不需要认证，移除Authorization头
    if (testCase.noAuth) {
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await api(config);
    
    if (response.status === 200 && response.data) {
      const data = response.data;
      
      // 检查响应时间戳
      const timestampCheck = checkTimeFormat(data.timestamp, testCase.expectedFormat);
      console.log(`   响应时间戳: ${data.timestamp} - ${timestampCheck.valid ? '✅' : '❌'} ${timestampCheck.reason}`);
      
      // 检查数据中的时间字段
      let dataTimeChecks = [];
      if (data.data) {
        const checkDataTimes = (obj, path = '') => {
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => checkDataTimes(item, `${path}[${index}]`));
          } else if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
              const fullPath = path ? `${path}.${key}` : key;
              const value = obj[key];
              
              // 检查常见的时间字段
              if (['createdAt', 'updatedAt', 'createTime', 'updateTime', 'uploadTime', 'lastSyncTime'].includes(key)) {
                const timeCheck = checkTimeFormat(value, testCase.expectedFormat);
                dataTimeChecks.push({
                  field: fullPath,
                  value: value,
                  valid: timeCheck.valid,
                  reason: timeCheck.reason
                });
              } else if (typeof value === 'object') {
                checkDataTimes(value, fullPath);
              }
            });
          }
        };
        
        checkDataTimes(data.data);
      }
      
      // 显示数据时间字段检查结果
      if (dataTimeChecks.length > 0) {
        dataTimeChecks.forEach(check => {
          console.log(`   数据时间 ${check.field}: ${check.value} - ${check.valid ? '✅' : '❌'} ${check.reason}`);
        });
      } else {
        console.log(`   数据时间: 无时间字段 - ℹ️ 正常`);
      }
      
      // 总体结果
      const allValid = timestampCheck.valid && dataTimeChecks.every(check => check.valid);
      console.log(`   结果: ${allValid ? '✅ 通过' : '❌ 失败'}`);
      
      return { success: true, valid: allValid, testCase };
      
    } else {
      console.log(`   结果: ❌ 响应异常 - 状态码: ${response.status}`);
      return { success: false, valid: false, testCase, error: `状态码: ${response.status}` };
    }
    
  } catch (error) {
    console.log(`   结果: ❌ 请求失败 - ${error.message}`);
    return { success: false, valid: false, testCase, error: error.message };
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始全系统时间格式化测试\n');
  
  // 检查配置
  if (TEST_TOKEN === 'your-jwt-token-here') {
    console.log('⚠️  警告: 请先设置有效的JWT token');
    console.log('   某些需要认证的接口可能会失败\n');
  }
  
  const results = [];
  let passCount = 0;
  let failCount = 0;
  
  // 逐个测试接口
  for (const testCase of testCases) {
    const result = await testSingleAPI(testCase);
    results.push(result);

    if (result.success && result.valid) {
      passCount++;
    } else {
      failCount++;
    }

    // 添加延迟，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 输出总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${testCases.length}`);
  console.log(`通过: ${passCount} ✅`);
  console.log(`失败: ${failCount} ❌`);
  console.log(`成功率: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
  
  // 显示失败的测试
  const failedTests = results.filter(r => !r.success || !r.valid);
  if (failedTests.length > 0) {
    console.log('\n❌ 失败的测试:');
    failedTests.forEach(test => {
      console.log(`   - ${test.testCase.name}: ${test.error || '时间格式不正确'}`);
    });
  }
  
  // 显示建议
  console.log('\n💡 建议:');
  if (failCount === 0) {
    console.log('   🎉 所有测试都通过了！时间格式化功能工作正常。');
  } else {
    console.log('   1. 检查服务是否正常启动');
    console.log('   2. 确认JWT token是否有效');
    console.log('   3. 检查失败接口的装饰器配置');
    console.log('   4. 验证时间格式化拦截器是否正常工作');
  }
  
  console.log('\n📚 相关文档:');
  console.log('   - 时间格式化指南: src/common/utils/TIME_FORMAT_GUIDE.md');
  console.log('   - 全局修改总结: src/common/utils/GLOBAL_TIME_FORMAT_SUMMARY.md');
}

/**
 * 主函数
 */
async function main() {
  try {
    await runAllTests();
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
main().catch(console.error);
