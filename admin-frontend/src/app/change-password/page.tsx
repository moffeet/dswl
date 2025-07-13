'use client';

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Message,
  Card
} from '@arco-design/web-react';
import {
  IconLock
} from '@arco-design/web-react/icon';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_ENDPOINTS } from '@/config/api';
import { createSecureLoginData } from '@/utils/crypto';

interface ChangePasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const username = searchParams.get('username');

  useEffect(() => {
    if (!userId || !username) {
      Message.error('参数错误，请重新登录');
      router.push('/login');
    }
  }, [userId, username, router]);

  const handleSubmit = async (values: ChangePasswordForm) => {
    console.log('🔧 handleSubmit 被调用，参数:', values);
    console.log('🔧 userId:', userId);
    console.log('🔧 newPassword length:', values.newPassword?.length);
    console.log('🔧 newPassword content:', values.newPassword);

    // 验证密码格式
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
    console.log('🔧 密码正则测试结果:', passwordRegex.test(values.newPassword));

    if (values.newPassword !== values.confirmPassword) {
      Message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      // 🔒 安全改进：加密密码后再发送
      const secureData = createSecureLoginData('', values.newPassword);

      const requestData = {
        userId: parseInt(userId!),
        newPassword: secureData.password, // 使用加密后的密码
        timestamp: secureData.timestamp,
        signature: secureData.signature,
        _encrypted: true
      };

      console.log('=== 密码修改加密传输 ===');
      console.log('原始密码长度:', values.newPassword.length);
      console.log('加密后数据:', {
        userId: requestData.userId,
        passwordLength: requestData.newPassword.length,
        hasTimestamp: !!requestData.timestamp,
        hasSignature: !!requestData.signature,
        isEncrypted: requestData._encrypted
      });
      console.log('🔧 发送加密修改密码数据，密码已加密处理');

      const response = await fetch(`${API_ENDPOINTS.auth.login.replace('/login', '/change-password')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('🔧 修改密码响应:', result);

      if (result.code === 200) {
        Message.success('密码修改成功，请重新登录');
        router.push('/login');
      } else {
        Message.error(result.message || '密码修改失败');
      }
    } catch (error) {
      console.error('🔧 修改密码失败:', error);
      Message.error('修改密码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (value: string) => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
    if (!passwordRegex.test(value)) {
      return '密码必须包含英文和数字，长度6-12位';
    }
    return true;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '400px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1D2129',
            margin: '0 0 8px 0'
          }}>
            首次登录修改密码
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#86909C',
            margin: 0
          }}>
            用户：{username}
          </p>
          <p style={{
            fontSize: '12px',
            color: '#86909C',
            margin: '8px 0 0 0'
          }}>
            密码必须包含英文和数字，长度6-12位
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            field="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { validator: (value) => validatePassword(value) }
            ]}
          >
            <Input.Password
              prefix={<IconLock style={{ color: '#86909C' }} />}
              placeholder="请输入新密码（英文+数字，6-12位）"
              size="large"
              style={{
                borderRadius: '8px',
                height: '48px'
              }}
            />
          </Form.Item>

          <Form.Item
            field="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认密码' }
            ]}
          >
            <Input.Password
              prefix={<IconLock style={{ color: '#86909C' }} />}
              placeholder="请再次输入新密码"
              size="large"
              style={{
                borderRadius: '8px',
                height: '48px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              long
              style={{
                height: '48px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
