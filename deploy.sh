#!/bin/bash

# PM2 部署脚本
# 使用方法: ./deploy.sh [environment]
# environment: production (默认) | staging | development

# 设置环境变量
ENVIRONMENT=${1:-production}

echo "🚀 开始部署到 $ENVIRONMENT 环境..."

# 检查 PM2 是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p logs

# 构建项目
echo "🔨 构建项目..."
npm run build

# 生成 Prisma 客户端
echo "🗄️ 生成 Prisma 客户端..."
npx prisma generate

# 运行数据库迁移（仅生产环境）
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔄 运行数据库迁移..."
    npx prisma migrate deploy
fi

# 启动或重载 PM2 应用
echo "🔄 启动/重载 PM2 应用..."
if pm2 describe blog-main-server > /dev/null 2>&1; then
    echo "♻️ 重载现有应用..."
    pm2 reload ecosystem.config.js --env $ENVIRONMENT
else
    echo "🆕 启动新应用..."
    pm2 start ecosystem.config.js --env $ENVIRONMENT
fi

# 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save

# 设置 PM2 开机自启（仅生产环境）
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔧 设置开机自启..."
    pm2 startup
fi

# 显示应用状态
echo "📊 应用状态:"
pm2 status

echo "✅ 部署完成！"
echo "📝 查看日志: pm2 logs blog-main-server"
echo "📊 查看监控: pm2 monit"
echo "🔄 重启应用: pm2 restart blog-main-server"
echo "🛑 停止应用: pm2 stop blog-main-server"