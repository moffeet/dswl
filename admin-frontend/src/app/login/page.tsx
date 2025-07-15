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
import { encryptPassword } from '../../utils/crypto';
import { API_BASE_URL } from '../../config/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForceLogin, setShowForceLogin] = useState(false);
  const [loginData, setLoginData] = useState<LoginForm | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
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

      // 🔒 安全改进：加密密码后再发送（简化版，只加密不签名）
      const encryptedPassword = encryptPassword(values.password);

      // 添加验证码信息
      const loginData = {
        username: values.username,
        password: encryptedPassword,
        captchaId: captchaData.id,
        captchaCode: values.captchaCode
      };

      console.log('=== 密码加密传输 ===');
      console.log('原始密码长度:', values.password.length);
      console.log('加密后数据:', {
        username: loginData.username,
        passwordLength: loginData.password.length,
        hasCaptcha: !!loginData.captchaId
      });
      console.log('发送加密登录数据，密码已加密处理');

      const result = await api.post(endpoint, loginData);

      if (result.code === 200) {
        if (result.data.accessToken) {
          console.log('✅ 登录成功 - 密码加密传输有效');

          // 检查是否需要修改密码
          if (result.data.requirePasswordChange) {
            // 首次登录，直接显示修改密码弹窗，不进入系统
            setShowChangePasswordModal(true);
            setChangePasswordError('');
            // 暂时保存token，修改密码成功后再正式登录
            localStorage.setItem('tempToken', result.data.accessToken);
          } else {
            // 使用认证上下文的login方法，只传递token
            await login(result.data.accessToken);
            Message.success(force ? '强制登录成功！' : '登录成功！');
            // 重置状态
            setShowForceLogin(false);
            setLoginData(null);
            // 跳转到主页
            router.push('/');
          }
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

  // 处理修改密码
  const handleChangePassword = async (values: any) => {
    setChangePasswordLoading(true);
    setChangePasswordError('');

    try {
      const tempToken = localStorage.getItem('tempToken');
      if (!tempToken) {
        setChangePasswordError('登录状态已过期，请重新登录');
        return;
      }

      // 检查密码值是否存在
      if (!values.oldPassword || !values.newPassword) {
        setChangePasswordError('请输入原密码和新密码');
        return;
      }

      // 🔒 安全改进：加密密码后再发送（修改密码只需要简单加密，不需要签名）
      const encryptedOldPassword = encryptPassword(values.oldPassword);
      const encryptedNewPassword = encryptPassword(values.newPassword);

      const requestData = {
        oldPassword: encryptedOldPassword, // 使用加密后的原密码
        newPassword: encryptedNewPassword// 使用加密后的新密码
      };

      console.log('=== 首次登录修改密码加密传输 ===');
      console.log('原密码长度:', values.oldPassword?.length || 0);
      console.log('新密码长度:', values.newPassword?.length || 0);
      console.log('加密后数据:', {
        hasOldPassword: !!requestData.oldPassword,
        hasNewPassword: !!requestData.newPassword
      });

      // 使用正确的API地址，手动设置Authorization header
      // 因为tempToken还没有存储到localStorage中
      const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.code === 200) {
        // 修改密码成功，正式登录
        localStorage.removeItem('tempToken');
        await login(tempToken);
        Message.success('密码修改成功！');
        setShowChangePasswordModal(false);
        changePasswordForm.resetFields();
        // 跳转到主页
        router.push('/');
      } else {
        setChangePasswordError(result.message || '修改密码失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      setChangePasswordError('修改密码失败，请重试');
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

      {/* 首次登录强制修改密码弹窗 */}
      <Modal
        title="修改密码"
        visible={showChangePasswordModal}
        footer={null}
        maskClosable={false}
        closable={false}
        style={{ width: 480 }}
      >
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#FFF7E6',
          border: '1px solid #FFD591',
          borderRadius: '6px'
        }}>
          <div style={{
            fontSize: '16px',
            color: '#D46B08',
            marginBottom: '8px'
          }}>
            首次登录，建议修改密码
          </div>
          <div style={{
            fontSize: '14px',
            color: '#86909C'
          }}>
            为了账户安全，建议您立即修改密码
          </div>
        </div>

        <Form
          form={changePasswordForm}
          layout="vertical"
          onSubmit={handleChangePassword}
          autoComplete="off"
        >
          <Form.Item
            label="原密码"
            field="oldPassword"
            rules={[
              { required: true, message: '请输入原密码' }
            ]}
          >
            <Input.Password
              placeholder="请输入原密码"
              size="large"
              prefix={<IconLock />}
            />
          </Form.Item>

          <Form.Item
            label="新密码"
            field="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              {
                validator: (value, callback) => {
                  if (!value) {
                    callback('请输入新密码');
                    return;
                  }
                  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/.test(value)) {
                    callback('密码必须包含英文和数字，长度6-12位');
                    return;
                  }
                  callback();
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
            label="确认密码"
            field="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              {
                validator: (value, callback) => {
                  const form = changePasswordForm;
                  const newPassword = form.getFieldValue('newPassword');
                  if (!value) {
                    callback('请再次输入新密码');
                    return;
                  }
                  if (value !== newPassword) {
                    callback('两次输入的密码不一致');
                    return;
                  }
                  callback();
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

          {changePasswordError && (
            <div style={{
              color: '#F53F3F',
              fontSize: '14px',
              marginBottom: '16px',
              textAlign: 'center',
              padding: '8px',
              backgroundColor: '#FFF2F0',
              border: '1px solid #FFCCC7',
              borderRadius: '6px'
            }}>
              {changePasswordError}
            </div>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={changePasswordLoading}
              style={{
                width: '100%',
                backgroundColor: '#165DFF',
                borderColor: '#165DFF'
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