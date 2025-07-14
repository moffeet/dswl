'use client';

import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Message,
  Card
} from '@arco-design/web-react';
import {
  IconLock,
  IconUser
} from '@arco-design/web-react/icon';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/config/api';
import { createSecureLoginData } from '@/utils/crypto';
import { useAuth } from '@/app/context/auth';

interface UpdatePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UpdatePasswordPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const validatePassword = (value: string) => {
    if (!value) {
      return Promise.reject('请输入密码');
    }
    
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
    if (!passwordRegex.test(value)) {
      return Promise.reject('密码必须包含英文和数字，长度6-12位');
    }
    
    return Promise.resolve();
  };

  const handleSubmit = async (values: UpdatePasswordForm) => {
    console.log('🔧 handleSubmit 被调用，参数:', values);

    // 验证密码格式
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
    
    if (!passwordRegex.test(values.oldPassword)) {
      Message.error('原密码格式不正确');
      return;
    }

    if (!passwordRegex.test(values.newPassword)) {
      Message.error('新密码格式不正确');
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      Message.error('两次输入的密码不一致');
      return;
    }

    if (values.oldPassword === values.newPassword) {
      Message.error('新密码不能与原密码相同');
      return;
    }

    setLoading(true);
    try {
      // 🔒 安全改进：加密密码后再发送
      const secureOldData = createSecureLoginData('', values.oldPassword);
      const secureNewData = createSecureLoginData('', values.newPassword);

      const requestData = {
        oldPassword: secureOldData.password, // 使用加密后的原密码
        newPassword: secureNewData.password, // 使用加密后的新密码
        timestamp: secureNewData.timestamp,
        signature: secureNewData.signature,
        _encrypted: true
      };

      console.log('=== 用户主动修改密码加密传输 ===');
      console.log('原密码长度:', values.oldPassword.length);
      console.log('新密码长度:', values.newPassword.length);
      console.log('加密后数据:', {
        hasOldPassword: !!requestData.oldPassword,
        hasNewPassword: !!requestData.newPassword,
        hasTimestamp: !!requestData.timestamp,
        hasSignature: !!requestData.signature,
        isEncrypted: requestData._encrypted
      });

      // 获取token
      const token = localStorage.getItem('token');
      if (!token) {
        Message.error('请先登录');
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.auth.login.replace('/login', '/update-password')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('🔧 修改密码响应:', result);

      if (result.code === 200) {
        Message.success('密码修改成功，请重新登录');
        // 清除登录状态，要求重新登录
        logout();
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

  const handleCancel = () => {
    router.back();
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
          width: '450px',
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
            修改密码
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#86909C',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <IconUser style={{ color: '#3b82f6' }} />
            当前用户：{user?.username || '未知'}
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
            field="oldPassword"
            label="原密码"
            rules={[
              { required: true, message: '请输入原密码' },
              { validator: (value) => validatePassword(value) }
            ]}
          >
            <Input.Password
              prefix={<IconLock style={{ color: '#86909C' }} />}
              placeholder="请输入原密码"
              size="large"
              style={{
                borderRadius: '8px',
                height: '48px'
              }}
            />
          </Form.Item>

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

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '32px' 
          }}>
            <Button
              type="outline"
              size="large"
              onClick={handleCancel}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              确认修改
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
