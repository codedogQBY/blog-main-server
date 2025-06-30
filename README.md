# 🚀 博客后端服务 (Blog Server)

一个功能完整的博客后端API服务，基于 NestJS 和 Prisma 构建，提供完整的博客功能和管理系统支持。

## ✨ 特性

- 🚀 **现代技术栈**: NestJS + Prisma + TypeScript
- 🔐 **完整认证**: JWT + 邮箱验证 + RBAC权限系统
- 📝 **内容管理**: 文章、分类、标签、随记管理
- 💬 **互动功能**: 评论、留言、点赞系统
- 📁 **文件管理**: 文件上传、存储、CDN集成
- 🔒 **安全特性**: 权限控制、数据验证、安全中间件
- 📊 **数据库**: MySQL + Prisma ORM
- 📧 **邮件服务**: 邮箱验证和通知
- 🐳 **容器化**: Docker 支持
- 📈 **可扩展**: 模块化架构设计

## 🛠️ 技术栈

- **框架**: NestJS 10
- **数据库**: MySQL 8.0 + Prisma ORM
- **认证**: JWT + Passport
- **语言**: TypeScript
- **验证**: class-validator + class-transformer
- **邮件**: NodeMailer
- **文件存储**: 又拍云 CDN
- **容器**: Docker + Docker Compose
- **文档**: Swagger/OpenAPI

## 📦 项目结构

```
src/
├── app.module.ts          # 应用主模块
├── main.ts               # 应用入口
├── auth/                 # 认证模块
│   ├── auth.controller.ts    # 认证控制器
│   ├── auth.service.ts       # 认证服务
│   ├── jwt.strategy.ts       # JWT策略
│   ├── guards/              # 守卫
│   └── dto/                 # 数据传输对象
├── blog/                 # 博客模块
│   ├── articles.controller.ts    # 文章控制器
│   ├── articles.service.ts       # 文章服务
│   ├── categories.controller.ts  # 分类控制器
│   ├── categories.service.ts     # 分类服务
│   ├── tags.controller.ts        # 标签控制器
│   ├── tags.service.ts           # 标签服务
│   ├── diary.controller.ts       # 随记控制器
│   ├── diary.service.ts          # 随记服务
│   ├── interactions.controller.ts # 互动控制器
│   ├── interactions.service.ts    # 互动服务
│   ├── sticky-notes.controller.ts # 留言控制器
│   ├── sticky-notes.service.ts    # 留言服务
│   └── dto/                      # 数据传输对象
├── files/                # 文件管理模块
│   ├── files.controller.ts   # 文件控制器
│   ├── files.service.ts      # 文件服务
│   ├── upyun.service.ts      # 又拍云服务
│   └── dto/                  # 数据传输对象
├── users/                # 用户管理模块
│   ├── users.controller.ts   # 用户控制器
│   ├── users.service.ts      # 用户服务
│   └── dto/                  # 数据传输对象
├── rbac/                 # 权限管理模块
│   ├── roles.controller.ts      # 角色控制器
│   ├── roles.service.ts         # 角色服务
│   ├── permissions.controller.ts # 权限控制器
│   ├── permissions.service.ts    # 权限服务
│   └── guards/                   # 权限守卫
├── mail/                 # 邮件服务模块
│   └── mail.service.ts       # 邮件服务
├── prisma/               # 数据库模块
│   ├── prisma.service.ts     # Prisma服务
│   └── schema.prisma         # 数据库模型
└── common/               # 通用模块
    ├── decorators/           # 装饰器
    ├── guards/              # 守卫
    ├── filters/             # 异常过滤器
    └── interceptors/        # 拦截器
```

## 🚀 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- MySQL 8.0 或更高版本
- npm/pnpm/yarn

### 安装

1. 克隆项目
```bash
git clone <repository-url>
cd blog-main-server
```

2. 安装依赖
```bash
npm install
# 或
pnpm install
```

3. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 数据库配置
DATABASE_URL="mysql://username:password@localhost:3306/blog_db"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# 邮件配置
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# 又拍云配置
UPYUN_SERVICE_NAME="your-service-name"
UPYUN_OPERATOR_NAME="your-operator"
UPYUN_OPERATOR_PASSWORD="your-password"
UPYUN_DOMAIN="https://your-domain.com"

# 应用配置
PORT=3001
NODE_ENV=development
```

4. 数据库初始化
```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 种子数据（可选）
npx prisma db seed
```

5. 创建管理员用户
```bash
npm run create-admin
```

6. 启动开发服务器
```bash
npm run start:dev
```

访问 [http://localhost:3001](http://localhost:3001) 查看应用。

### 使用 Docker

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 📚 API 文档

启动服务后，访问以下地址查看 API 文档：

- Swagger UI: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
- JSON 规范: [http://localhost:3001/api-docs-json](http://localhost:3001/api-docs-json)

## 🔧 核心功能

### 🔐 认证系统

#### 用户注册/登录
```typescript
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
```

#### 邮箱验证
```typescript
POST /api/auth/send-verification-code
POST /api/auth/verify-email
```

### 📝 博客管理

#### 文章管理
```typescript
GET    /api/articles              # 获取文章列表
GET    /api/articles/:id          # 获取文章详情
POST   /api/articles              # 创建文章
PUT    /api/articles/:id          # 更新文章
DELETE /api/articles/:id          # 删除文章
```

#### 分类管理
```typescript
GET    /api/categories            # 获取分类列表
POST   /api/categories            # 创建分类
PUT    /api/categories/:id        # 更新分类
DELETE /api/categories/:id        # 删除分类
```

#### 标签管理
```typescript
GET    /api/tags                  # 获取标签列表
POST   /api/tags                  # 创建标签
PUT    /api/tags/:id              # 更新标签
DELETE /api/tags/:id              # 删除标签
```

### 📓 随记系统

#### 随记管理
```typescript
GET    /api/diary/notes           # 获取随记列表
GET    /api/diary/notes/:id       # 获取随记详情
POST   /api/diary/admin/notes     # 创建随记
PUT    /api/diary/admin/notes/:id # 更新随记
DELETE /api/diary/admin/notes/:id # 删除随记
```

#### 签名管理
```typescript
GET    /api/diary/signature       # 获取当前签名
POST   /api/diary/admin/signatures # 创建签名
PUT    /api/diary/admin/signatures/:id # 更新签名
DELETE /api/diary/admin/signatures/:id # 删除签名
```

### 💬 互动功能

#### 评论系统
```typescript
GET    /api/interactions          # 获取评论列表
POST   /api/interactions          # 创建评论
PUT    /api/interactions/:id      # 更新评论
DELETE /api/interactions/:id      # 删除评论
```

#### 留言墙
```typescript
GET    /api/sticky-notes          # 获取留言列表
POST   /api/sticky-notes          # 创建留言
PUT    /api/sticky-notes/:id      # 更新留言
DELETE /api/sticky-notes/:id      # 删除留言
```

### 📁 文件管理

```typescript
POST   /api/files/upload          # 上传文件
GET    /api/files                 # 获取文件列表
DELETE /api/files/:id             # 删除文件
```

### 👥 用户管理

```typescript
GET    /api/users                 # 获取用户列表
POST   /api/users                 # 创建用户
PUT    /api/users/:id             # 更新用户
DELETE /api/users/:id             # 删除用户
```

### 🔒 权限管理

#### 角色管理
```typescript
GET    /api/roles                 # 获取角色列表
POST   /api/roles                 # 创建角色
PUT    /api/roles/:id             # 更新角色
DELETE /api/roles/:id             # 删除角色
```

#### 权限管理
```typescript
GET    /api/permissions           # 获取权限列表
POST   /api/permissions           # 创建权限
PUT    /api/permissions/:id       # 更新权限
DELETE /api/permissions/:id       # 删除权限
POST   /api/permissions/sync      # 同步权限
```

## 🗄️ 数据库模型

### 主要实体

- **User**: 用户信息
- **Role**: 角色定义
- **Permission**: 权限定义
- **Article**: 文章内容
- **Category**: 文章分类
- **Tag**: 文章标签
- **DiaryNote**: 随记内容
- **DiarySignature**: 签名配置
- **DiaryWeatherConfig**: 天气配置
- **Interaction**: 评论互动
- **StickyNote**: 留言墙
- **File**: 文件管理

### 关系设计

```prisma
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  username    String?
  roles       UserRole[]
  articles    Article[]
  // ...
}

model Article {
  id          Int      @id @default(autoincrement())
  title       String
  content     String   @db.Text
  author      User     @relation(fields: [authorId], references: [id])
  category    Category @relation(fields: [categoryId], references: [id])
  tags        ArticleTag[]
  // ...
}
```

## 🔒 权限系统

### RBAC 设计

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

// 角色权限
'role.read'
'role.create'
'role.update'
'role.delete'
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

# 调试模式
npm run start:debug

# 构建
npm run build

# 测试
npm run test
npm run test:e2e
npm run test:cov

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
npx prisma migrate deploy

# 数据库重置
npx prisma migrate reset

# 查看数据库
npx prisma studio

# 种子数据
npx prisma db seed
```

## 🚀 部署指南

### 使用 Docker

1. 构建镜像
```bash
docker build -t blog-server .
```

2. 运行容器
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  blog-server
```

### 使用 PM2

1. 全局安装 PM2
```bash
npm install -g pm2
```

2. 构建应用
```bash
npm run build
```

3. 启动应用
```bash
pm2 start dist/main.js --name blog-server
```

### 环境变量

生产环境必需的环境变量：

```env
NODE_ENV=production
DATABASE_URL="mysql://user:pass@host:port/database"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## 🔒 安全特性

### 数据验证
- 使用 `class-validator` 进行输入验证
- 自动数据转换和清理
- SQL 注入防护

### 认证安全
- JWT Token 管理
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
- 缓存策略

### API 优化
- 响应数据压缩
- 分页查询
- 懒加载关联
- 接口缓存

## 🧪 测试

### 单元测试
```bash
npm run test
```

### 端到端测试
```bash
npm run test:e2e
```

### 测试覆盖率
```bash
npm run test:cov
```

## 📝 开发规范

### 代码规范
- 使用 ESLint + Prettier
- TypeScript 严格模式
- 统一的错误处理
- API 响应格式统一

### 提交规范
遵循 Conventional Commits：
```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具
```

## 🐛 常见问题

### Q: 数据库连接失败？
A: 检查数据库配置和网络连接，确保 MySQL 服务正常运行。

### Q: JWT Token 验证失败？
A: 检查 JWT_SECRET 配置，确保前后端使用相同的密钥。

### Q: 邮件发送失败？
A: 检查 SMTP 配置，确保邮箱服务器设置正确。

### Q: 文件上传失败？
A: 检查又拍云配置和网络连接。

## 📄 许可证

MIT License

## 🙏 致谢

- [NestJS](https://nestjs.com/) - Node.js 框架
- [Prisma](https://prisma.io/) - 数据库 ORM
- [JWT](https://jwt.io/) - 身份验证
- [class-validator](https://github.com/typestack/class-validator) - 数据验证
- [NodeMailer](https://nodemailer.com/) - 邮件服务