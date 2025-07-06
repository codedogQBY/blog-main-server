#!/bin/bash

echo "=== SEO配置设置脚本 ==="
echo ""

# 检查.env文件是否存在
if [ ! -f .env ]; then
    echo "创建.env文件..."
    cat > .env << EOF
# 数据库配置
DATABASE_URL="mysql://root:123456@localhost:3306/blog"

# JWT配置
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# 邮件配置
MAIL_HOST="smtp.qq.com"
MAIL_PORT=587
MAIL_USER="your-email@qq.com"
MAIL_PASS="your-email-password"

# 文件上传配置
UPYUN_BUCKET="your-bucket"
UPYUN_OPERATOR="your-operator"
UPYUN_PASSWORD="your-password"
UPYUN_ENDPOINT="https://v0.api.upyun.com"

# SEO配置
SITE_URL="http://localhost:3000"
BAIDU_SEO_TOKEN=""
GOOGLE_SEO_TOKEN=""
EOF
    echo "✅ .env文件已创建"
else
    echo "✅ .env文件已存在"
fi

echo ""
echo "=== SEO配置说明 ==="
echo ""
echo "1. 百度站长平台token获取："
echo "   - 访问：https://ziyuan.baidu.com/"
echo "   - 注册并添加你的网站"
echo "   - 在'推送' → '普通收录'中获取token"
echo ""
echo "2. Google Search Console："
echo "   - 访问：https://search.google.com/search-console"
echo "   - 注册并添加你的网站"
echo "   - 获取API密钥"
echo ""
echo "3. 编辑.env文件，设置以下变量："
echo "   SITE_URL=你的网站域名"
echo "   BAIDU_SEO_TOKEN=你的百度token"
echo "   GOOGLE_SEO_TOKEN=你的谷歌token"
echo ""
echo "4. 重启服务："
echo "   npm run start:dev"
echo ""
echo "详细说明请查看 SEO_CONFIG.md 文件" 