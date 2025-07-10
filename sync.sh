#!/bin/bash

# 双远程仓库同步脚本
# 自动提交并同步到Gitee和GitHub
# 用法: ./sync.sh "提交信息"

GITEE_URL="https://gitee.com/aread/dswl1.git"
GITHUB_URL="https://github.com/moffeet/dswl.git"

# 检查参数
if [ $# -eq 0 ]; then
    echo "❌ 请提供提交信息"
    echo "用法: ./sync.sh \"提交信息\""
    echo "示例: ./sync.sh \"修复登录bug\""
    exit 1
fi

COMMIT_MESSAGE="$*"

echo "🚀 开始自动提交并同步到双远程仓库..."
echo "📝 提交信息: $COMMIT_MESSAGE"
echo ""

# 检查并配置远程仓库
check_and_setup_remotes() {
    echo "🔍 检查远程仓库配置..."
    
    # 检查origin远程仓库
    if ! git remote | grep -q "^origin$"; then
        echo "⚙️  配置origin远程仓库(Gitee)..."
        git remote add origin "$GITEE_URL"
    else
        echo "✅ origin远程仓库已存在"
    fi
    
    # 检查github远程仓库
    if ! git remote | grep -q "^github$"; then
        echo "⚙️  配置github远程仓库..."
        git remote add github "$GITHUB_URL"
    else
        echo "✅ github远程仓库已存在"
    fi
    
    # 确保origin可以同时推送到两个仓库
    echo "⚙️  配置origin同时推送到两个仓库..."
    git remote set-url --delete --push origin "$GITEE_URL" 2>/dev/null || true
    git remote set-url --delete --push origin "$GITHUB_URL" 2>/dev/null || true
    git remote set-url --add --push origin "$GITEE_URL"
    git remote set-url --add --push origin "$GITHUB_URL"
    
    echo "📋 当前远程仓库配置："
    git remote -v
    echo ""
}

# 自动提交更改
commit_changes() {
    echo "📦 开始提交更改..."
    
    # 检查是否有更改（包括未跟踪的文件）
    if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
        echo "ℹ️  没有检测到更改，跳过提交步骤"
        return 0
    fi
    
    # 添加所有更改
    echo "📁 添加所有更改..."
    git add .
    
    if [ $? -ne 0 ]; then
        echo "❌ git add 失败"
        exit 1
    fi
    
    # 提交更改
    echo "💾 提交更改..."
    git commit -m "$COMMIT_MESSAGE"
    
    if [ $? -ne 0 ]; then
        echo "❌ git commit 失败"
        exit 1
    fi
    
    echo "✅ 提交成功！"
    echo ""
}

# 推送到所有远程仓库
push_to_remotes() {
    # 获取当前分支
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [ -z "$CURRENT_BRANCH" ]; then
        echo "❌ 无法获取当前分支"
        exit 1
    fi
    
    echo "📤 推送分支: $CURRENT_BRANCH"
    echo ""
    
    # 推送到所有远程仓库
    echo "🌐 推送到所有远程仓库..."
    git push origin "$CURRENT_BRANCH"
    
    if [ $? -eq 0 ]; then
        echo "✅ 成功推送到所有远程仓库！"
    else
        echo "❌ 推送失败"
        echo ""
        echo "💡 如果是首次推送或有冲突，请尝试："
        echo "   git push origin $CURRENT_BRANCH --force"
        echo "   或者："
        echo "   git pull origin $CURRENT_BRANCH --rebase"
        echo "   git push origin $CURRENT_BRANCH"
        exit 1
    fi
}

# 主流程
main() {
    # 检查是否在git仓库中
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo "❌ 当前目录不是git仓库"
        exit 1
    fi
    
    # 配置远程仓库
    check_and_setup_remotes
    
    # 自动提交更改
    commit_changes
    
    # 推送到远程仓库
    push_to_remotes
    
    echo ""
    echo "🎉 自动提交并同步完成！"
    echo "📝 提交信息: $COMMIT_MESSAGE"
    echo "📍 Gitee: $GITEE_URL"
    echo "📍 GitHub: $GITHUB_URL"
}

# 执行主流程
main 