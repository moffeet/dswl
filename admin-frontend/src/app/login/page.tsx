'use client';

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Message,
  Card,
  Modal
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
  const [changePasswordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForceLogin, setShowForceLogin] = useState(false);
  const [loginData, setLoginData] = useState<LoginForm | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
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

      if (result.code === 200) {
        // 检查是否需要修改密码
        if (result.data.requirePasswordChange) {
          Message.info('首次登录，请修改密码');
          setCurrentUserId(result.data.userId);
          setCurrentUsername(result.data.username || values.username);
          setShowChangePasswordModal(true);
          return;
        }

        if (result.data.accessToken) {
          console.log('✅ 登录成功 - 密码加密传输有效');

          // 使用认证上下文的login方法，只传递token
          await login(result.data.accessToken);

          Message.success(force ? '强制登录成功！' : '登录成功！');

          // 重置状态
          setShowForceLogin(false);
          setLoginData(null);

          // 跳转到主页
          router.push('/');
        }
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

  const handleChangePassword = async (values: any) => {
    console.log('🔧 handleChangePassword 被调用，参数:', values);
    console.log('🔧 currentUserId:', currentUserId);
    console.log('🔧 currentUsername:', currentUsername);
    console.log('🔧 newPassword length:', values.newPassword?.length);
    console.log('🔧 newPassword content:', values.newPassword);

    // 验证密码格式
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
    console.log('🔧 密码正则测试结果:', passwordRegex.test(values.newPassword));

    if (!currentUserId) {
      console.error('🔧 currentUserId 为空');
      Message.error('用户ID不存在，请重新登录');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const requestData = {
        userId: currentUserId,
        newPassword: values.newPassword
      };
      console.log('🔧 发送修改密码请求数据:', requestData);

      const result = await api.post('/auth/change-password', requestData);

      console.log('🔧 修改密码响应:', result);

      if (result.code === 200) {
        Message.success('密码修改成功！');
        setShowChangePasswordModal(false);
        changePasswordForm.resetFields();

        // 修改密码成功后，使用新密码重新登录
        if (loginData) {
          const newLoginData = { ...loginData, password: values.newPassword };
          await handleLogin(newLoginData, false);
        }
      } else {
        Message.error(result.message || '密码修改失败');
      }
    } catch (error: any) {
      console.error('🔧 修改密码错误:', error);
      Message.error(error.message || '修改密码失败');
    } finally {
      setChangePasswordLoading(false);
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

      {/* 修改密码弹窗 */}
      <Modal
        title="首次登录 - 修改密码"
        visible={showChangePasswordModal}
        onCancel={() => {
          setShowChangePasswordModal(false);
          changePasswordForm.resetFields();
        }}
        footer={null}
        maskClosable={false}
        closable={false}
        width={480}
      >
        <div style={{ marginBottom: '16px', color: '#86909C' }}>
          <p>用户：<strong>{currentUsername}</strong></p>
          <p>为了账户安全，首次登录需要修改密码</p>
          <p style={{ fontSize: '12px', color: '#F53F3F' }}>
            注意：新密码不能与用户名相同
          </p>
        </div>

        <Form
          form={changePasswordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          autoComplete="off"
          onFinishFailed={(errorInfo) => {
            console.log('🔧 表单验证失败:', errorInfo);
            Message.error('请检查表单输入');
          }}
        >
          <Form.Item
            label="新密码"
            field="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/,
                message: '密码必须包含英文和数字，长度6-12位'
              }
            ]}
          >
            <Input.Password
              placeholder="请输入新密码（英文+数字，6-12位）"
              size="large"
              prefix={<IconLock />}
            />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            field="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              size="large"
              prefix={<IconLock />}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={changePasswordLoading}
              size="large"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              onClick={() => {
                console.log('🔧🔧🔧 登录页面修改密码按钮被点击了！');
                alert('登录页面修改密码按钮被点击了！');

                const values = changePasswordForm.getFieldsValue();
                console.log('🔧 表单当前值:', values);

                // 手动调用处理函数
                handleChangePassword(values);
              }}
            >
              {changePasswordLoading ? '修改中...' : '确认修改'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}