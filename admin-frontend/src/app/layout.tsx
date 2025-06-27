import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@arco-design/web-react/dist/css/arco.css';
import Navigation from '../components/Navigation';

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
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          backgroundColor: '#f5f5f5',
          overflow: 'hidden' // 防止整体页面出现滚动条
        }}>
          {/* 侧边栏 - 固定宽度 */}
          <div style={{ 
            width: '240px', 
            minWidth: '240px', // 确保最小宽度
            flexShrink: 0, // 防止被压缩
            backgroundColor: '#fff', 
            borderRight: '1px solid #e5e7eb',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 10
          }}>
            {/* 系统标题 */}
            <div style={{ 
              padding: '20px 16px', 
              borderBottom: '1px solid #e5e7eb', 
              color: '#1890ff', 
              fontSize: '18px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fafbfc'
            }}>
              🎯 物流管理系统
            </div>
            
            {/* 导航菜单 */}
            <Navigation />
          </div>

          {/* 右侧主要内容区域 */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0, // 防止flex子元素溢出
            height: '100vh',
            overflow: 'hidden'
          }}>
            {/* 顶部栏 */}
            <div style={{ 
              backgroundColor: '#fff', 
              padding: '0 24px', 
              borderBottom: '1px solid #e5e7eb', 
              height: 64, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              flexShrink: 0, // 防止被压缩
              zIndex: 5
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                <span>🏠</span>
                <span>/</span>
                <span>管理后台</span>
              </div>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <span style={{ 
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  欢迎回来，管理员
                </span>
              </div>
            </div>

            {/* 主内容区域 */}
            <div style={{ 
              flex: 1,
              overflow: 'auto', // 内容区域可滚动
              backgroundColor: '#f9fafb'
            }}>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
