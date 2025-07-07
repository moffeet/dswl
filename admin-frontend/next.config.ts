import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 优化配置，加快启动速度
  // 注意：Next.js 15+ 中 optimizeFonts 和 swcMinify 已默认启用
  turbopack: {
    // Turbopack 优化配置（替代 experimental.turbo）
    resolveAlias: {
      // 可以在这里添加路径别名
    },
  },
};

export default nextConfig;
