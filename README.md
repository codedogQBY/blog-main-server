# 🚀 博客后端服务 (Blog Main Server)

一个功能完整的博客后端API服务，基于 NestJS 和 Prisma 构建，支持本地开发和 Vercel 无服务器部署。

## ✨ 特性

- 🚀 **现代技术栈**: NestJS + Prisma + TypeScript
- 🔐 **完整认证**: JWT + 双因素认证(2FA) + RBAC权限系统
- 📝 **内容管理**: 文章、分类、标签、随记管理
- 💬 **互动功能**: 评论、留言、点赞系统
- 📁 **文件管理**: 文件上传、存储、又拍云CDN集成
- 🔒 **安全特性**: 权限控制、数据验证、安全中间件
- 📊 **数据库**: MySQL + Prisma ORM
- 📧 **邮件服务**: 邮箱验证和通知系统
- 🌐 **跨域支持**: CORS 配置和跨域资源共享
- ☁️ **无服务器**: 支持 Vercel 无服务器部署
- 🤖 **AI集成**: 支持智谱AI接口
- 📈 **访客统计**: 游客访问统计和IP地理位置
- 🛡️ **系统配置**: 灵活的系统配置管理

## 🛠️ 技术栈

- **框架**: NestJS 11
- **数据库**: MySQL 8.0 + Prisma ORM
- **认证**: JWT + Passport + 双因素认证
- **语言**: TypeScript
- **验证**: class-validator + class-transformer
- **邮件**: NodeMailer
- **文件存储**: 又拍云 CDN
- **部署**: Vercel 无服务器
- **AI服务**: 智谱AI
- **身份验证**: Speakeasy (2FA)

## 🚀 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- MySQL 8.0 或更高版本
- npm/pnpm/yarn

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/codedogQBY/blog-main-server.git
cd blog-main-server
```

2. **安装依赖**
```bash
npm install
# 或
pnpm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 数据库配置
DATABASE_URL="mysql://username:password@hostname:port/database_name"

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# 邮件服务配置
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@163.com
SMTP_PASS=your-smtp-password
SMTP_FROM="your-email@163.com"

# 管理员账户配置
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# 又拍云存储配置
UPYUN_BUCKET=your-bucket-name
UPYUN_OPERATOR=your-operator
UPYUN_PASSWORD=your-upyun-password
UPYUN_DOMAIN=your-domain.upcdn.net
UPYUN_API_DOMAIN=v0.api.upyun.com
UPYUN_PROTOCOL=http

# 环境配置
NODE_ENV=development
DEV_VERIFICATION_CODE=123456

# SEO配置
SITE_URL=https://your-domain.com
BAIDU_SEO_TOKEN=
GOOGLE_SEO_TOKEN=

# AI服务配置
ZHIPU_API_KEY=your-zhipu-api-key
```

4. **数据库初始化**
```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 种子数据（可选）
npx prisma db seed
```

5. **启动开发服务器**
```bash
npm run start:dev
```

访问 [http://localhost:3001](http://localhost:3001) 查看应用。

## ☁️ Vercel 部署

### 部署步骤

1. **全局安装 Vercel CLI**
```bash
npm install -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
vercel
```

4. **配置环境变量**
在 Vercel Dashboard 中设置以下环境变量：
```env
DATABASE_URL=mysql://username:password@hostname:port/database_name
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@163.com
SMTP_PASS=your-smtp-password
SMTP_FROM="your-email@163.com"
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
UPYUN_BUCKET=your-bucket-name
UPYUN_OPERATOR=your-operator
UPYUN_PASSWORD=your-upyun-password
UPYUN_DOMAIN=your-domain.upcdn.net
UPYUN_API_DOMAIN=v0.api.upyun.com
UPYUN_PROTOCOL=http
NODE_ENV=production
SITE_URL=https://your-vercel-domain.vercel.app
ZHIPU_API_KEY=your-zhipu-api-key
```

5. **重新部署**
```bash
vercel --prod
```

### 部署配置

项目已配置以下文件支持 Vercel 部署：

- `vercel.json` - Vercel 部署配置
- `api/index.ts` - Vercel 函数入口点
- `.vercelignore` - 忽略文件配置

### CORS 配置

项目已配置 CORS 支持，允许跨域请求：
- 支持所有来源 (`*`)
- 支持所有 HTTP 方法
- 支持常用请求头

## 📚 API 文档

### 主要接口

#### 🔐 认证接口
```typescript
POST /auth/login               # 用户登录
POST /auth/register           # 用户注册
POST /auth/logout             # 用户登出
POST /auth/refresh            # 刷新令牌
POST /auth/verify-email       # 邮箱验证
POST /auth/send-verification-code  # 发送验证码
POST /auth/enable-2fa         # 启用双因素认证
POST /auth/verify-2fa         # 验证双因素认证
```

#### 📝 文章管理
```typescript
GET    /articles              # 获取文章列表
GET    /articles/:id          # 获取文章详情
POST   /articles              # 创建文章
PUT    /articles/:id          # 更新文章
DELETE /articles/:id          # 删除文章
```

#### 📓 随记系统
```typescript
GET    /diary/notes           # 获取随记列表
GET    /diary/notes/:id       # 获取随记详情
POST   /diary/admin/notes     # 创建随记
PUT    /diary/admin/notes/:id # 更新随记
DELETE /diary/admin/notes/:id # 删除随记
```

#### 💬 互动功能
```typescript
GET    /interactions          # 获取评论列表
POST   /interactions          # 创建评论
PUT    /interactions/:id      # 更新评论
DELETE /interactions/:id      # 删除评论
```

#### 📁 文件管理
```typescript
POST   /files/upload          # 上传文件
GET    /files                 # 获取文件列表
DELETE /files/:id             # 删除文件
```

#### 👥 用户管理
```typescript
GET    /users                 # 获取用户列表
GET    /users/:id             # 获取用户详情
POST   /users                 # 创建用户
PUT    /users/:id             # 更新用户
DELETE /users/:id             # 删除用户
```

#### 🔒 权限管理
```typescript
GET    /roles                 # 获取角色列表
POST   /roles                 # 创建角色
PUT    /roles/:id             # 更新角色
DELETE /roles/:id             # 删除角色
GET    /permissions           # 获取权限列表
POST   /permissions/sync      # 同步权限
```

#### 📊 系统管理
```typescript
GET    /system/config         # 获取系统配置
PUT    /system/config         # 更新系统配置
GET    /userinfo              # 获取游客信息
GET    /userinfo/export       # 导出游客数据
```

## 🔒 权限系统

### RBAC 设计

项目采用基于角色的访问控制（RBAC）：
- **用户 (User)**: 系统使用者
- **角色 (Role)**: 权限集合
- **权限 (Permission)**: 具体操作权限

### 权限格式

权限采用 `资源.操作` 格式：
```typescript
// 文章权限
'article.read'
'article.create'
'article.update'
'article.delete'

// 用户权限
'user.read'
'user.create'
'user.update'
'user.delete'

// 系统权限
'system.config'
'system.userinfo'
```

### 权限装饰器

```typescript
@RequirePermissions('article.create')
@Post()
async createArticle(@Body() dto: CreateArticleDto) {
  return this.articleService.create(dto);
}
```

## 🔧 开发工具

### 开发命令

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod

# 构建
npm run build

# 测试
npm run test

# 代码检查
npm run lint
npm run format
```

### 数据库命令

```bash
# 生成客户端
npx prisma generate

# 数据库迁移
npx prisma migrate dev

# 查看数据库
npx prisma studio

# 种子数据
npx prisma db seed
```

## 🔒 安全特性

### 数据验证
- 使用 `class-validator` 进行输入验证
- 自动数据转换和清理
- SQL 注入防护

### 认证安全
- JWT Token 管理
- 双因素认证 (2FA)
- 密码哈希存储
- 邮箱验证机制
- 权限细粒度控制

### 请求安全
- CORS 跨域保护
- 请求频率限制
- 文件上传安全检查
- XSS 防护

## 📈 性能优化

### 数据库优化
- 数据库索引优化
- 查询性能监控
- 连接池管理
- 分页查询

### API 优化
- 响应数据压缩
- 懒加载关联
- 接口缓存
- 无服务器部署

## 🐛 常见问题

### Q: Vercel 部署后 CORS 错误？
A: 检查 `vercel.json` 中的 headers 配置，确保 CORS 头部设置正确。

### Q: 数据库连接失败？
A: 检查数据库配置和网络连接，确保 MySQL 服务正常运行。

### Q: JWT Token 验证失败？
A: 检查 JWT_SECRET 配置，确保前后端使用相同的密钥。

### Q: 邮件发送失败？
A: 检查 SMTP 配置，确保邮箱服务器设置正确。

### Q: 文件上传失败？
A: 检查又拍云配置和网络连接。

### Q: 双因素认证问题？
A: 确保客户端和服务器时间同步，检查 2FA 配置。

## 📄 许可证

MIT License

## 🙏 致谢

- [NestJS](https://nestjs.com/) - Node.js 框架
- [Prisma](https://prisma.io/) - 数据库 ORM
- [Vercel](https://vercel.com/) - 无服务器部署平台
- [JWT](https://jwt.io/) - 身份验证
- [class-validator](https://github.com/typestack/class-validator) - 数据验证
- [NodeMailer](https://nodemailer.com/) - 邮件服务
- [又拍云](https://www.upyun.com/) - CDN 存储服务