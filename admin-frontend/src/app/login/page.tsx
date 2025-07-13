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
  captchaCode: string;
}

interface CaptchaData {
  id: string;
  svg: string;
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
  const [changePasswordError, setChangePasswordError] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  // 获取验证码
  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const result = await api.get('/auth/captcha');
      if (result.code === 200) {
        setCaptchaData(result.data);
      } else {
        Message.error('获取验证码失败');
      }
    } catch (error) {
      console.error('获取验证码失败:', error);
      Message.error('获取验证码失败');
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 设置默认值和获取验证码
  useEffect(() => {
    form.setFieldsValue({
      username: 'admin',
      password: 'admin2025'
    });
    fetchCaptcha(); // 页面加载时获取验证码
  }, [form]);

  const handleLogin = async (values: LoginForm, force = false) => {
    setLoading(true);
    setError(''); // 清除之前的错误信息

    // 验证验证码是否已获取
    if (!captchaData) {
      setError('请先获取验证码');
      setLoading(false);
      return;
    }

    // 验证验证码是否已输入
    if (!values.captchaCode) {
      setError('请输入验证码');
      setLoading(false);
      return;
    }

    try {
      const endpoint = force ? '/auth/login/force' : '/auth/login';

      // 🔒 安全改进：加密密码后再发送
      const secureData = createSecureLoginData(values.username, values.password);

      // 添加验证码信息
      const loginData = {
        ...secureData,
        captchaId: captchaData.id,
        captchaCode: values.captchaCode
      };
      
      console.log('=== 密码加密传输 ===');
      console.log('原始密码长度:', values.password.length);
      console.log('加密后数据:', {
        username: loginData.username,
        passwordLength: loginData.password.length,
        hasTimestamp: !!loginData.timestamp,
        hasSignature: !!loginData.signature,
        isEncrypted: loginData._encrypted,
        hasCaptcha: !!loginData.captchaId
      });
      console.log('发送加密登录数据，密码已加密处理');

      const result = await api.post(endpoint, loginData);

      if (result.code === 200) {
        // 检查是否需要修改密码
        if (result.data.requirePasswordChange) {
          Message.info('首次登录，请修改密码');
          setCurrentUserId(result.data.userId);
          setCurrentUsername(result.data.username || values.username);
          setChangePasswordError(''); // 清除之前的错误
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
        // 登录失败时重新获取验证码
        await fetchCaptcha();
        // 清空验证码输入
        form.setFieldValue('captchaCode', '');
      }
    } catch (error: any) {
      console.error('❌ 登录错误:', error);
      setError(error.message || '网络连接失败，请稍后重试');
      // 登录失败时重新获取验证码
      await fetchCaptcha();
      // 清空验证码输入
      form.setFieldValue('captchaCode', '');
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
      setChangePasswordError('用户ID不存在，请重新登录');
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError(''); // 清除之前的错误
    try {
      // 🔒 安全改进：加密密码后再发送
      const secureData = createSecureLoginData('', values.newPassword);

      const requestData = {
        userId: currentUserId,
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

      const result = await api.post('/auth/change-password', requestData);

      console.log('🔧 修改密码响应:', result);

      if (result.code === 200) {
        // 显示成功弹窗
        setShowChangePasswordModal(false);
        changePasswordForm.resetFields();
        setShowSuccessModal(true);
      } else {
        setChangePasswordError(result.message || '密码修改失败');
      }
    } catch (error: any) {
      console.error('🔧 修改密码错误:', error);
      setChangePasswordError(error.message || '修改密码失败');
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
          onSubmit={async (values) => {
            console.log('🔧 表单验证成功，提交的值:', values);
            await handleLogin(values);
          }}
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

          {/* 验证码输入框 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: error ? '8px' : '24px' }}>
            <Form.Item
              field="captchaCode"
              rules={[{ required: true, message: '请输入验证码' }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Input
                placeholder="请输入验证码"
                size="large"
                style={{
                  borderRadius: '8px',
                  height: '48px',
                  borderColor: error ? '#F53F3F' : undefined
                }}
                maxLength={4}
              />
            </Form.Item>
            <div
              style={{
                width: '120px',
                height: '48px',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: '#f5f5f5',
                position: 'relative'
              }}
              onClick={fetchCaptcha}
              title="点击刷新验证码"
            >
              {captchaLoading ? (
                <div style={{ color: '#86909C' }}>加载中...</div>
              ) : captchaData ? (
                <div
                  dangerouslySetInnerHTML={{ __html: captchaData.svg }}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              ) : (
                <div style={{ color: '#86909C', fontSize: '12px' }}>点击获取</div>
              )}
            </div>
          </div>

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
            <strong>初始密码与账户一致</strong>
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
        style={{ width: 480 }}
      >
        <div style={{ marginBottom: '16px', color: '#86909C' }}>
          <p>用户：<strong>{currentUsername}</strong></p>
          <p>为了账户安全，首次登录需要修改密码</p>
          <p style={{ fontSize: '12px', color: '#F53F3F' }}>
            注意：新密码不能与用户名相同
          </p>
        </div>

        {/* 错误提示区域 */}
        {changePasswordError && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#FFF2F0',
            border: '1px solid #FFCCC7',
            borderRadius: '6px',
            color: '#F53F3F',
            fontSize: '14px'
          }}>
            {changePasswordError}
          </div>
        )}

        <Form
          form={changePasswordForm}
          layout="vertical"
          onSubmit={handleChangePassword}
          autoComplete="off"
          onSubmitFailed={(errorInfo: any) => {
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
                validator: (value: string | undefined, callback: (error?: React.ReactNode) => void) => {
                  if (!value) {
                    callback();
                    return;
                  }
                  const pattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/;
                  if (!pattern.test(value)) {
                    callback('密码必须包含英文和数字，长度6-12位');
                  } else {
                    callback();
                  }
                }
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
              {
                validator: (value: string | undefined, callback: (error?: React.ReactNode) => void) => {
                  if (!value) {
                    callback();
                    return;
                  }
                  const newPassword = changePasswordForm.getFieldValue('newPassword');
                  if (newPassword === value) {
                    callback();
                  } else {
                    callback('两次输入的密码不一致');
                  }
                }
              }
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

      {/* 密码修改成功弹窗 */}
      <Modal
        title="密码修改成功"
        visible={showSuccessModal}
        onCancel={() => setShowSuccessModal(false)}
        footer={[
          <Button
            key="confirm"
            type="primary"
            onClick={async () => {
              setShowSuccessModal(false);
              // 修改密码成功后，使用新密码重新登录
              if (loginData) {
                const newLoginData = { ...loginData, password: changePasswordForm.getFieldValue('newPassword') };
                await handleLogin(newLoginData, false);
              }
            }}
          >
            确认
          </Button>
        ]}
        maskClosable={false}
        closable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '16px', color: '#52C41A', marginBottom: '12px' }}>
            ✅ 密码修改成功！
          </div>
          <div style={{ fontSize: '14px', color: '#86909C' }}>
            点击确认按钮将自动使用新密码登录
          </div>
        </div>
      </Modal>
    </div>
  );
}