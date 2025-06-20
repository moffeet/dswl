import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@arco-design/web-react/dist/css/arco.css';

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "物流配送管理系统",
  description: "物流配送管理系统后台管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f5f5f5' }}>
          {/* 侧边栏 */}
          <div style={{ width: 200, backgroundColor: '#fff', borderRight: '1px solid #f0f0f0' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
              🎯 物流管理系统
            </div>
            <div style={{ padding: '8px 0' }}>
              <a href="/customers" style={{ display: 'block', padding: '12px 16px', color: '#666', textDecoration: 'none' }}>
                👤 客户管理
              </a>
              <a href="/users" style={{ display: 'block', padding: '12px 16px', color: '#666', textDecoration: 'none' }}>
                👥 用户管理
              </a>
              <a href="/roles" style={{ display: 'block', padding: '12px 16px', color: '#666', textDecoration: 'none' }}>
                🔐 角色权限
              </a>
              <a href="/drivers" style={{ display: 'block', padding: '12px 16px', color: '#666', textDecoration: 'none' }}>
                🚛 司机管理
              </a>
              <a href="/checkin" style={{ display: 'block', padding: '12px 16px', color: '#666', textDecoration: 'none' }}>
                📅 打卡记录
              </a>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {/* 顶部栏 */}
            <div style={{ backgroundColor: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏠</span>
                <span>/</span>
                <span>管理后台</span>
              </div>
              <div>
                <span style={{ marginRight: 16 }}>欢迎回来，管理员</span>
              </div>
            </div>

            {/* 主内容区域 */}
            <div style={{ flex: 1 }}>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
