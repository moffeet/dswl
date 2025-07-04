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
import api from '../../utils/api';
import { createSecureLoginData } from '../../utils/crypto';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForceLogin, setShowForceLogin] = useState(false);
  const [loginData, setLoginData] = useState<LoginForm | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  // 设置默认值
  useEffect(() => {
    form.setFieldsValue({
      username: 'admin',
      password: '123456'
    });
  }, [form]);

  const handleLogin = async (values: LoginForm, force = false) => {
    setLoading(true);
    setError(''); // 清除之前的错误信息
    
    try {
      const endpoint = force ? '/auth/login/force' : '/auth/login';
      
      // 🔒 安全改进：加密密码后再发送
      const secureData = createSecureLoginData(values.username, values.password);
      
      console.log('=== 密码加密传输 ===');
      console.log('原始密码长度:', values.password.length);
      console.log('加密后数据:', {
        username: secureData.username,
        passwordLength: secureData.password.length,
        hasTimestamp: !!secureData.timestamp,
        hasSignature: !!secureData.signature,
        isEncrypted: secureData._encrypted
      });
      console.log('发送加密登录数据，密码已加密处理');
      
      const result = await api.post(endpoint, secureData);

      if (result.code === 200 && result.data.accessToken) {
        console.log('✅ 登录成功 - 密码加密传输有效');
        
        // 使用认证上下文的login方法，只传递token
        await login(result.data.accessToken);
        
        Message.success(force ? '强制登录成功！' : '登录成功！');
        
        // 重置状态
        setShowForceLogin(false);
        setLoginData(null);
        
        // 跳转到主页
        router.push('/');
      } else if (result.code === 409) {
        // IP冲突，显示强制登录选项
        setLoginData(values);
        setShowForceLogin(true);
        setError(result.message);
      } else {
        // 设置错误信息到状态，而不是使用全局Message
        setError(result.message || '登录失败，请检查用户名和密码');
      }
    } catch (error: any) {
      console.error('❌ 登录错误:', error);
      setError(error.message || '网络连接失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogin = () => {
    if (loginData) {
      handleLogin(loginData, true);
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
          
          {/* 强制登录按钮 */}
          {showForceLogin && (
            <Form.Item style={{ marginTop: '-8px', marginBottom: '24px' }}>
              <Button
                type="default"
                onClick={handleForceLogin}
                loading={loading}
                size="large"
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#F53F3F',
                  borderColor: '#F53F3F',
                  color: 'white'
                }}
              >
                {loading ? '强制登录中...' : '强制登录（踢出其他会话）'}
              </Button>
            </Form.Item>
          )}
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