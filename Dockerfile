FROM node:18-alpine AS base

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat curl openssl1.1-compat
RUN npm install -g pnpm

# 设置pnpm镜像源
RUN pnpm config set registry https://registry.npmmirror.com

WORKDIR /app

# 依赖安装阶段
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成Prisma客户端
RUN pnpm prisma generate

# 构建应用
RUN pnpm build

# 运行时阶段
FROM base AS runner

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# 设置工作目录
WORKDIR /app

# 复制必要文件
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# 切换到非root用户
USER nestjs

EXPOSE 3001

# 启动脚本
COPY --chown=nestjs:nodejs <<EOF /app/start.sh
#!/bin/sh
set -e

echo "等待MySQL数据库就绪..."
sleep 10

echo "运行数据库迁移..."
npx prisma migrate deploy

echo "启动NestJS应用..."
exec node dist/main.js
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"] 