const jwt = require('./backend-node/node_modules/jsonwebtoken');

// JWT密钥（与后端配置一致）
const JWT_SECRET = 'logistics-system-jwt-secret-2024';

// 小程序用户信息（从数据库查询到的）
const wxUser = {
  id: 1,
  name: '张三',
  phone: '13800138001',
  role: '司机'
};

// 生成JWT token
const payload = {
  sub: wxUser.id,
  username: wxUser.name,
  phone: wxUser.phone,
  role: wxUser.role,
  userType: 'wx-user'
};

const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('🎫 生成的JWT Token:');
console.log(accessToken);
console.log('\n📋 Token信息:');
console.log('用户ID:', wxUser.id);
console.log('用户名:', wxUser.name);
console.log('手机号:', wxUser.phone);
console.log('角色:', wxUser.role);
console.log('用户类型: wx-user');

console.log('\n🧪 测试命令:');
console.log('\n1. 测试客户查询接口:');
console.log(`curl -X GET "http://localhost:3000/api/miniprogram/customers/search?customerNumber=C001" \\
  -H "Authorization: Bearer ${accessToken}"`);

console.log('\n2. 测试客户地址更新接口:');
console.log(`curl -X PATCH "http://localhost:3000/api/miniprogram/customers/update" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerNumber": "C001",
    "operatorName": "张三",
    "storeAddress": "新的门店地址",
    "warehouseAddress": "新的仓库地址"
  }'`);

console.log('\n3. 测试签收单上传接口:');
console.log(`# 需要创建一个测试图片文件
echo "test image content" > test-image.jpg
curl -X POST "http://localhost:3000/api/miniprogram/receipts/upload" \\
  -H "Authorization: Bearer ${accessToken}" \\
  -F "file=@test-image.jpg" \\
  -F "customerNumber=C001" \\
  -F "wxUserName=张三" \\
  -F "deliveryType=送货" \\
  -F "notes=测试签收单"`);
