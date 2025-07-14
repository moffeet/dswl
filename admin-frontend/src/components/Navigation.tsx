'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../app/context/auth';
import { usePermission } from '../app/context/permission';
import { Button, Dropdown, Menu, Avatar, Space, Alert, Modal, Form, Input, Message } from '@arco-design/web-react';
import { IconUser, IconPoweroff, IconSettings, IconHome, IconUserGroup, IconLocation, IconFile, IconMobile, IconNav, IconLock, IconDown, IconRight } from '@arco-design/web-react/icon';
import { API_ENDPOINTS } from '../config/api';
import { createSecureLoginData } from '../utils/crypto';

interface NavigationProps {}

export default function Navigation({}: NavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { permissionInfo, hasRole, isLoading } = usePermission();

  // 密码验证函数
  const validatePassword = (value: string, callback: (error?: string) => void) => {
    if (!value) {
      callback('请输入密码');
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
    if (!passwordRegex.test(value)) {
      callback('密码必须包含英文和数字，长度6-12位');
      return;
    }

    callback();
  };

  // 确认密码验证函数
  const validateConfirmPassword = (value: string, callback: (error?: string) => void) => {
    const newPassword = changePasswordForm.getFieldValue('newPassword');
    if (!value) {
      callback('请确认密码');
      return;
    }
    if (value !== newPassword) {
      callback('两次输入的密码不一致');
      return;
    }
    callback();
  };

  // 验证新密码不能与原密码相同
  const validateNewPassword = (value: string, callback: (error?: string) => void) => {
    if (!value) {
      callback('请输入新密码');
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
    if (!passwordRegex.test(value)) {
      callback('密码必须包含英文和数字，长度6-12位');
      return;
    }

    const oldPassword = changePasswordForm.getFieldValue('oldPassword');
    if (oldPassword && value === oldPassword) {
      callback('新密码不能与原密码相同');
      return;
    }

    callback();
  };

  // 处理修改密码
  const handleChangePassword = async (values: any) => {
    console.log('🔧 handleChangePassword 被调用，参数:', values);

    setChangePasswordLoading(true);
    try {
      // 🔒 安全改进：加密密码后再发送（和首次修改密码相同的加密方式）
      const secureOldData = createSecureLoginData('', values.oldPassword);
      const secureNewData = createSecureLoginData('', values.newPassword);

      const requestData = {
        oldPassword: secureOldData.password, // 使用加密后的原密码
        newPassword: secureNewData.password, // 使用加密后的新密码
        _encrypted: true
      };

      console.log('=== 用户主动修改密码加密传输 ===');
      console.log('原密码长度:', values.oldPassword.length);
      console.log('新密码长度:', values.newPassword.length);

      // 获取token
      const token = localStorage.getItem('token');
      if (!token) {
        // 将错误设置到表单字段上，而不是全局提示
        changePasswordForm.setFieldsError({
          oldPassword: '请先登录'
        });
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
        Message.success('密码修改成功，即将跳转到登录页');
        setChangePasswordVisible(false);
        changePasswordForm.resetFields();

        // 延迟一下再跳转，让用户看到成功提示
        setTimeout(() => {
          // 清除登录状态，跳转到登录页
          logout();
          router.push('/login');
        }, 1500);
      } else {
        // 根据错误类型，将错误信息设置到对应的表单字段上
        const errorMessage = result.message || '密码修改失败';

        if (errorMessage.includes('原密码') || errorMessage.includes('密码错误') || errorMessage.includes('密码不正确')) {
          changePasswordForm.setFieldsError({
            oldPassword: errorMessage
          });
        } else if (errorMessage.includes('新密码')) {
          changePasswordForm.setFieldsError({
            newPassword: errorMessage
          });
        } else {
          // 通用错误显示在原密码字段
          changePasswordForm.setFieldsError({
            oldPassword: errorMessage
          });
        }
      }
    } catch (error) {
      console.error('🔧 修改密码失败:', error);
      // 网络错误等异常也显示在表单中
      changePasswordForm.setFieldsError({
        oldPassword: '修改密码失败，请稍后重试'
      });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // 图标映射
  const iconMap: { [key: string]: React.ReactNode } = {
    'IconHome': <IconHome />,
    'IconUser': <IconUser />,
    'IconUserGroup': <IconUserGroup />,
    'IconLocation': <IconLocation />,
    'IconFileText': <IconFile />,
    'IconMobile': <IconMobile />,
    'IconMap': <IconNav />,
    'IconLock': <IconLock />,
  };

  // 切换子菜单展开状态
  const toggleSubmenu = (menuCode: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuCode)) {
      newExpanded.delete(menuCode);
    } else {
      newExpanded.add(menuCode);
    }
    setExpandedMenus(newExpanded);
  };

  // 渲染菜单项（支持子菜单）
  const renderMenuItem = (menu: any, level: number = 0) => {
    const isActive = pathname === menu.path;
    const isHovered = hoveredItem === menu.code;
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.code);
    const paddingLeft = 20 + (level * 16); // 根据层级调整缩进

    return (
      <div key={menu.code}>
        {/* 主菜单项 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: `14px ${paddingLeft}px`,
            color: isActive ? '#1890ff' : '#374151',
            fontSize: '14px',
            fontWeight: isActive ? '600' : '500',
            transition: 'all 0.2s ease',
            borderLeft: `3px solid ${isActive ? '#1890ff' : (isHovered ? '#1890ff' : 'transparent')}`,
            backgroundColor: isActive ? '#e6f7ff' : (isHovered ? '#f3f4f6' : 'transparent'),
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHoveredItem(menu.code)}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => {
            if (hasChildren) {
              toggleSubmenu(menu.code);
            } else {
              // 如果没有子菜单，使用客户端路由跳转
              console.log('🔗 导航到:', menu.path);
              router.push(menu.path);
            }
          }}
        >
          <span style={{ fontSize: '16px' }}>
            {iconMap[menu.icon || 'IconHome'] || '📄'}
          </span>
          <span style={{ flex: 1 }}>{menu.name}</span>
          {hasChildren && (
            <span style={{ fontSize: '12px', transition: 'transform 0.2s' }}>
              {isExpanded ? <IconDown /> : <IconRight />}
            </span>
          )}
        </div>

        {/* 子菜单 */}
        {hasChildren && isExpanded && (
          <div>
            {menu.children.map((child: any) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const userMenuItems = [
    {
      key: 'change-password',
      label: (
        <Space>
          <IconLock />
          修改密码
        </Space>
      ),
    },
    {
      key: 'logout',
      label: (
        <Space>
          <IconPoweroff />
          退出登录
        </Space>
      ),
    },
  ];

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'logout':
        logout();
        break;
      case 'change-password':
        // 显示修改密码弹窗
        setChangePasswordVisible(true);
        changePasswordForm.resetFields();
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* 用户信息区域 */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #f0f0f0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Dropdown
          droplist={
            <Menu onClickMenuItem={handleMenuClick}>
              {userMenuItems.map((item: any) => (
                <Menu.Item key={item.key}>{item.label}</Menu.Item>
              ))}
            </Menu>
          }
          position="bottom"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
          }}>
            <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
              {user?.nickname?.[0] || user?.username?.[0] || 'U'}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.nickname || user?.username || '未知用户'}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.roles?.map(role => role.roleName).join(', ') || '管理员'}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>

      {/* 导航菜单 */}
      <div style={{
        flex: 1,
        padding: '12px 0',
        overflowY: 'auto'
      }}>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            加载菜单中...
          </div>
        ) : !hasRole ? (
          <div style={{ padding: '12px 20px' }}>
            <Alert
              type="warning"
              content="您还没有分配角色，只能访问首页。请联系管理员分配角色。"
              style={{ fontSize: '12px' }}
            />
          </div>
        ) : !permissionInfo?.menus || permissionInfo.menus.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            暂无可访问的菜单
          </div>
        ) : (
          permissionInfo.menus.map((menu) => renderMenuItem(menu))
        )}
      </div>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        visible={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false);
          changePasswordForm.resetFields();
        }}
        footer={null}
        width={400}
        style={{ top: '20vh' }}
      >
        <Form
          form={changePasswordForm}
          layout="vertical"
          onSubmit={handleChangePassword}
          autoComplete="off"
        >
          <Form.Item
            field="oldPassword"
            label="原密码"
            rules={[
              { required: true, message: '请输入原密码' },
              { validator: validatePassword }
            ]}
          >
            <Input.Password
              prefix={<IconLock style={{ color: '#86909C' }} />}
              placeholder="请输入原密码"
              size="large"
              style={{
                borderRadius: '8px',
                height: '40px'
              }}
            />
          </Form.Item>

          <Form.Item
            field="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { validator: validateNewPassword }
            ]}
          >
            <Input.Password
              prefix={<IconLock style={{ color: '#86909C' }} />}
              placeholder="请输入新密码（英文+数字，6-12位）"
              size="large"
              style={{
                borderRadius: '8px',
                height: '40px'
              }}
            />
          </Form.Item>

          <Form.Item
            field="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认密码' },
              { validator: validateConfirmPassword }
            ]}
          >
            <Input.Password
              prefix={<IconLock style={{ color: '#86909C' }} />}
              placeholder="请再次输入新密码"
              size="large"
              style={{
                borderRadius: '8px',
                height: '40px'
              }}
            />
          </Form.Item>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            justifyContent: 'flex-end'
          }}>
            <Button
              size="large"
              onClick={() => {
                setChangePasswordVisible(false);
                changePasswordForm.resetFields();
              }}
              style={{
                borderRadius: '8px',
                height: '40px'
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={changePasswordLoading}
              style={{
                borderRadius: '8px',
                height: '40px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none'
              }}
            >
              确认修改
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}