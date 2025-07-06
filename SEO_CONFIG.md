# SEO配置说明

## 环境变量配置

在 `blog-main-server/.env` 文件中添加以下配置：

```env
# SEO配置
SITE_URL=https://yourdomain.com
BAIDU_SEO_TOKEN=your_baidu_seo_token
GOOGLE_SEO_TOKEN=your_google_seo_token
```

## 配置说明

### SITE_URL
- 你的网站域名，用于生成文章的规范链接
- 开发环境：`http://localhost:3000`
- 生产环境：`https://yourdomain.com`

### BAIDU_SEO_TOKEN（百度站长平台）

#### 获取步骤：
1. **注册百度站长平台**
   - 访问：https://ziyuan.baidu.com/
   - 使用百度账号登录

2. **添加网站**
   - 点击"添加网站"
   - 输入你的网站域名
   - 验证网站所有权（推荐使用HTML文件验证）

3. **获取推送token**
   - 验证成功后，进入网站管理页面
   - 点击左侧菜单"推送" → "普通收录"
   - 在页面中找到"接口调用地址"
   - token就是URL中的token参数

#### 示例：
```
接口调用地址：http://data.zz.baidu.com/urls?site=https://yourdomain.com&token=your_token_here
```
其中 `your_token_here` 就是你的BAIDU_SEO_TOKEN

### GOOGLE_SEO_TOKEN（Google Search Console）

#### 获取步骤：
1. **注册Google Search Console**
   - 访问：https://search.google.com/search-console
   - 使用Google账号登录

2. **添加网站**
   - 点击"添加资源"
   - 输入你的网站域名
   - 验证网站所有权（推荐使用HTML文件验证）

3. **获取API密钥**
   - 验证成功后，进入网站管理页面
   - 点击左侧菜单"设置" → "用户和权限"
   - 创建新的API密钥

#### 注意：
- Google Search Console需要更复杂的OAuth2认证
- 当前版本仅记录日志，实际提交需要额外的OAuth2配置

## 功能说明

### 自动提交到搜索引擎
- 当文章发布时，系统会自动将文章URL提交到百度站长平台
- 支持批量提交多个URL

### SEO字段
- `metaTitle`: SEO标题（留空则使用文章标题）
- `metaDescription`: SEO描述（留空则使用文章摘要）
- `metaKeywords`: SEO关键词，用逗号分隔
- `canonicalUrl`: 规范链接（留空则使用默认URL）

### 前台SEO优化
- 文章详情页自动生成meta标签
- 支持Open Graph和Twitter Card
- 自动生成规范链接

## 测试配置

### 1. 创建.env文件
```bash
cd blog-main-server
cp .env.example .env
```

### 2. 编辑.env文件
```env
SITE_URL=http://localhost:3000
BAIDU_SEO_TOKEN=your_actual_token
GOOGLE_SEO_TOKEN=your_actual_token
```

### 3. 重启服务
```bash
npm run start:dev
```

### 4. 测试SEO提交
- 在管理后台发布一篇文章
- 查看服务器日志，确认SEO提交是否成功
- 在百度站长平台查看推送记录 