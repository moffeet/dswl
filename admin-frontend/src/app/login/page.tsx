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
  IconUser, 
  IconLock
} from '@arco-design/web-react/icon';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  // 设置默认值
  useEffect(() => {
    form.setFieldsValue({
      username: 'admin',
      password: '123456'
    });
  }, [form]);

  const handleLogin = async (values: LoginForm) => {
    setLoading(true);
    setError(''); // 清除之前的错误信息
    
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok && result.accessToken) {
        // 使用认证上下文的login方法
        login(result.accessToken, result.user);
        
        Message.success('登录成功！');
        
        // 跳转到主页
        router.push('/');
      } else {
        // 设置错误信息到状态，而不是使用全局Message
        setError(result.message || '登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('登录错误:', error);
      setError('网络连接失败，请稍后重试');
    } finally {
      setLoading(false);
    }
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
            物流配送管理系统
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#86909C',
            margin: 0
          }}>
            请登录您的管理员账号
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onSubmit={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            field="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<IconUser style={{ color: '#86909C' }} />}
              placeholder="请输入用户名"
              size="large"
              style={{
                borderRadius: '8px',
                height: '48px'
              }}
            />
          </Form.Item>

          <Form.Item
            field="password"
            rules={[{ required: true, message: '请输入密码' }]}
            style={{ marginBottom: error ? '8px' : '24px' }}
          >
            <Input.Password
              prefix={<IconLock style={{ color: '#86909C' }} />}
              placeholder="请输入密码"
              size="large"
              style={{
                borderRadius: '8px',
                height: '48px',
                borderColor: error ? '#F53F3F' : undefined
              }}
            />
          </Form.Item>

          {/* 错误提示信息 */}
          {error && (
            <div style={{
              color: '#F53F3F',
              fontSize: '14px',
              marginBottom: '16px',
              marginTop: '-8px',
              paddingLeft: '4px'
            }}>
              {error}
            </div>
          )}

          <Form.Item style={{ marginBottom: '24px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          color: '#86909C',
          fontSize: '12px'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>默认管理员账号：</strong>admin
          </p>
          <p style={{ margin: '0 0 16px 0' }}>
            <strong>默认密码：</strong>123456
          </p>
          <p style={{ margin: 0 }}>
            忘记密码？请联系系统管理员
          </p>
        </div>
      </Card>
    </div>
  );
} 