const axios = require('axios');

async function testPermissions() {
  try {
    console.log('🔍 开始测试超级管理员权限问题...\n');

    // 1. 先获取验证码
    console.log('1. 获取验证码...');
    const captchaResponse = await axios.get('http://localhost:3000/api/auth/captcha');
    const captchaId = captchaResponse.data.data.id;
    console.log('✅ 获取验证码成功，ID:', captchaId);

    // 获取验证码文本（开发环境）
    const captchaTextResponse = await axios.get(`http://localhost:3000/api/auth/captcha/${captchaId}/text`);
    const captchaText = captchaTextResponse.data.data.text;
    console.log('✅ 获取验证码文本:', captchaText);

    // 2. 登录获取token
    console.log('2. 尝试登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin2025',
      captchaId: captchaId,
      captchaCode: captchaText  // 使用实际的验证码
    });

    if (loginResponse.data.code !== 200) {
      console.error('❌ 登录失败:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.accessToken;
    console.log('✅ 登录成功，获取到token');

    // 3. 获取权限信息
    console.log('\n3. 获取权限信息...');
    const permissionResponse = await axios.get('http://localhost:3000/api/auth/permissions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('权限接口响应:', JSON.stringify(permissionResponse.data, null, 2));

    if (permissionResponse.data.code === 200) {
      const data = permissionResponse.data.data;
      console.log('\n📋 权限信息分析:');
      console.log('- 是否有角色:', data.hasRole);
      console.log('- 角色列表:', data.roles.map(r => `${r.roleName}(${r.roleCode})`));
      console.log('- 权限数量:', data.permissions.length);
      console.log('- 菜单数量:', data.menus.length);
      
      console.log('\n🔍 详细权限列表:');
      data.permissions.forEach(permission => {
        console.log(`  - ${permission}`);
      });

      console.log('\n🔍 详细菜单列表:');
      data.menus.forEach(menu => {
        console.log(`  - ${menu.name} (${menu.path}) - ${menu.code}`);
      });

      // 4. 检查是否为超级管理员
      const isAdmin = data.roles.some(role => role.roleCode === 'admin');
      console.log('\n🎯 是否为超级管理员:', isAdmin);

      if (isAdmin && data.permissions.length === 0) {
        console.log('❌ 问题发现：超级管理员权限列表为空！');
      } else if (isAdmin && data.permissions.length > 0) {
        console.log('✅ 超级管理员权限正常');
      }
    } else {
      console.error('❌ 获取权限信息失败:', permissionResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

testPermissions();
