const fs = require('fs');

async function testExport() {
  try {
    // 1. 先登录获取token
    console.log('正在登录...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    console.log('登录响应:', loginData);

    if (loginData.code !== 200) {
      throw new Error('登录失败: ' + loginData.message);
    }

    const token = loginData.data.accessToken;
    console.log('获取到token:', token.substring(0, 50) + '...');

    // 2. 测试导出API
    console.log('正在测试导出API...');
    const exportResponse = await fetch('http://localhost:3000/api/customers/export', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    console.log('导出响应状态:', exportResponse.status);
    console.log('导出响应头:', Object.fromEntries(exportResponse.headers.entries()));

    if (!exportResponse.ok) {
      const errorText = await exportResponse.text();
      console.error('导出失败:', errorText);
      return;
    }

    // 3. 保存文件
    const arrayBuffer = await exportResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync('test-customers-export.xlsx', buffer);
    console.log('导出成功！文件已保存为 test-customers-export.xlsx');
    console.log('文件大小:', buffer.length, '字节');

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testExport();
