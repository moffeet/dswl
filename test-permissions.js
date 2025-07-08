// 测试权限API的脚本
const API_BASE = 'http://localhost:3000/api';

async function testLogin(username, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const result = await response.json();
    console.log(`\n=== 登录测试: ${username} ===`);
    console.log('登录结果:', result.code === 200 ? '成功' : '失败');
    
    if (result.code === 200) {
      return result.data.token;
    }
    return null;
  } catch (error) {
    console.error('登录错误:', error);
    return null;
  }
}

async function testPermissions(token, username) {
  try {
    const response = await fetch(`${API_BASE}/auth/permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log(`\n=== ${username} 权限信息 ===`);
    console.log('是否有角色:', result.data.hasRole);
    console.log('角色列表:', result.data.roles.map(r => `${r.roleName}(${r.roleCode})`));
    console.log('权限数量:', result.data.permissions.length);
    console.log('可访问菜单:', result.data.menus.map(m => `${m.name}(${m.path})`));
    
    return result.data;
  } catch (error) {
    console.error('获取权限错误:', error);
    return null;
  }
}

async function runTests() {
  console.log('🚀 开始测试角色权限系统...\n');
  
  // 测试超级管理员
  const adminToken = await testLogin('admin', '123456');
  if (adminToken) {
    await testPermissions(adminToken, 'admin');
  }
  
  // 测试没有角色的用户
  const managerToken = await testLogin('manager001', '123456');
  if (managerToken) {
    await testPermissions(managerToken, 'manager001');
  }
  
  console.log('\n✅ 测试完成！');
}

// 运行测试
runTests().catch(console.error);
