#!/bin/bash

# 物流配送管理系统 - 停止生产环境脚本
# 作者: AI Assistant
# 版本: 1.0

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 主函数
main() {
    log_info "🛑 正在停止物流配送管理系统生产环境服务..."
    
    # 检查 PM2 是否安装
    if ! command_exists pm2; then
        log_warning "PM2 未安装，无法通过 PM2 管理服务"
        return 0
    fi
    
    # 显示当前 PM2 状态
    log_info "当前 PM2 服务状态："
    pm2 status
    
    # 停止特定服务
    log_info "停止物流配送管理系统服务..."
    
    # 停止后端服务
    if pm2 stop wlxt-backend 2>/dev/null; then
        log_success "后端服务已停止"
    else
        log_warning "后端服务未在运行或停止失败"
    fi
    
    # 停止管理后台服务
    if pm2 stop wlxt-admin 2>/dev/null; then
        log_success "管理后台服务已停止"
    else
        log_warning "管理后台服务未在运行或停止失败"
    fi
    
    # 停止小程序前端服务
    if pm2 stop wlxt-frontend 2>/dev/null; then
        log_success "小程序前端服务已停止"
    else
        log_warning "小程序前端服务未在运行或停止失败"
    fi
    
    # 询问是否删除服务
    echo ""
    read -p "是否要删除 PM2 中的服务配置？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "删除 PM2 服务配置..."
        
        pm2 delete wlxt-backend 2>/dev/null || true
        pm2 delete wlxt-admin 2>/dev/null || true
        pm2 delete wlxt-frontend 2>/dev/null || true
        
        # 保存 PM2 配置
        pm2 save
        
        log_success "PM2 服务配置已删除"
    else
        log_info "保留 PM2 服务配置"
    fi
    
    # 显示最终状态
    echo ""
    log_info "最终 PM2 状态："
    pm2 status
    
    echo ""
    log_success "🎉 物流配送管理系统生产环境服务已停止！"
    echo ""
    echo "📝 可用命令："
    echo "  pm2 start wlxt-backend   # 启动后端服务"
    echo "  pm2 start wlxt-admin     # 启动管理后台服务"
    echo "  pm2 start wlxt-frontend  # 启动小程序前端服务"
    echo "  pm2 start all            # 启动所有服务"
    echo "  ./start-prod.sh          # 重新启动整个系统"
    echo "=========================================="
}

# 运行主函数
main "$@" 