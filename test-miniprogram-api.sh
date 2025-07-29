#!/bin/bash

echo "🧪 小程序API Token测试"
echo "=================================="

BASE_URL="http://localhost:3000/api/miniprogram/customers"

echo ""
echo "1️⃣ 测试无Token访问"
echo "-------------------"
curl -s -w "\n📊 HTTP状态码: %{http_code}\n" "$BASE_URL"

echo ""
echo "2️⃣ 测试无效Token格式"
echo "-------------------"
curl -s -w "\n📊 HTTP状态码: %{http_code}\n" \
  -H "Authorization: Bearer invalid_token_format" \
  "$BASE_URL"

echo ""
echo "3️⃣ 测试错误的JWT格式"
echo "-------------------"
curl -s -w "\n📊 HTTP状态码: %{http_code}\n" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_payload.wrong_signature" \
  "$BASE_URL"

echo ""
echo "4️⃣ 测试空的Authorization头"
echo "-------------------"
curl -s -w "\n📊 HTTP状态码: %{http_code}\n" \
  -H "Authorization: Bearer " \
  "$BASE_URL"

echo ""
echo "5️⃣ 测试错误的Bearer格式"
echo "-------------------"
curl -s -w "\n📊 HTTP状态码: %{http_code}\n" \
  -H "Authorization: InvalidFormat token123" \
  "$BASE_URL"

echo ""
echo "6️⃣ 测试带查询参数的无效Token"
echo "-------------------"
curl -s -w "\n📊 HTTP状态码: %{http_code}\n" \
  -H "Authorization: Bearer invalid_token" \
  "$BASE_URL?customerName=测试&page=1&limit=5"

echo ""
echo "=================================="
echo "✅ 测试完成！"
echo ""
echo "📋 预期结果："
echo "- HTTP状态码: 401 (Unauthorized)"
echo "- 响应体code: 403 (PARAM_ERROR)"
echo "- 响应消息: 'Unauthorized' 或具体错误信息"
echo ""
echo "💡 说明："
echo "- 所有无效token情况都应该返回401状态码"
echo "- 响应体中的code统一为403（参数错误）"
echo "- 这是系统的统一异常处理机制"
