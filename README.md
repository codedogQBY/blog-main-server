1. 用户表 (users)
   字段名	类型	约束	默认值	说明
   id	VARCHAR(255)	PRIMARY KEY	-	用户ID，浏览器指纹或者uuv4
   name	VARCHAR(100)	NOT NULL	-	用户名
   mail	VARCHAR(100)	NOT NULL	-	邮箱
   password	VARCHAR(100)	NOT NULL	-	密码
   imgurl	VARCHAR(100)	NULL	-	头像地址
   user_type	INT	NOT NULL	-	1-注册用户 2 游客
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
2. 分组表 (subset)
   字段名	类型	约束	默认值	说明
   id	INT	PRIMARY KEY, AUTO_INCREMENT	-	分类ID
   subset_name	VARCHAR(100)	NOT NULL	-	分类名称
   classify	INT	NOT NULL	-	类型(1文章，2图片，3资源)
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
3. 本地文件表 (file)
   字段名	类型	约束	默认值	说明
   id	INT	PRIMARY KEY, AUTO_INCREMENT	-	文件ID
   url	VARCHAR(100)	NOT NULL	-	文件地址
   file_name	VARCHAR(100)	NOT NULL	-	文件名称
   format	VARCHAR(32)	NOT NULL	-	文件格式
   subset_id	INT	NULL	-	所属分类
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
4. 文章表 (article)
   字段名	类型	约束	默认值	说明
   id	INT	PRIMARY KEY, AUTO_INCREMENT	-	文章ID
   title	VARCHAR(200)	NOT NULL	-	标题
   subset_id	INT	NULL	-	所属分类
   classify	INT	NOT NULL	-	类型(1文章，2图片)
   label	VARCHAR(200)	NULL	-	标签
   introduce	VARCHAR(1000)	NULL	-	简介
   content	VARCHAR(5000)	NULL	-	内容
   cover	VARCHAR(100)	NULL	-	封面地址
   views	INT	-	0	查看次数
   state	INT	-	0	文章状态
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
4. 留言表 (guest_message)
   字段名	类型	约束	默认值	说明
   id	INT	PRIMARY KEY, AUTO_INCREMENT	-	留言ID
   content	VARCHAR(500)	NOT NULL	-	内容
   color	VARCHAR(100)	NO NULL	-	颜色
   tag	INT	NO NULL	-	标签
   user_name	VARCHAR(100)		匿名	署名
   user_id	VARCHAR(255)	NO NULL	-	用户id
   state	INT	-	0	留言状态
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
5. 点赞表 (praise)
   字段名	类型	约束	默认值	说明
   id	INT	PRIMARY KEY, AUTO_INCREMENT	-	点赞ID
   user_id	VARCHAR(255)	NOT NULL	-	用户ID
   user_type	INT	NOT NULL	-	用户类型
   for_id	INT	NOT NULL	-	所属内容id
   for_type	INT	NOT NULL	-	所属内容类型（1-文章，2-留言）
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
6. 评论表 (comment)
   字段名	类型	约束	默认值	说明
   id	INT	PRIMARY KEY, AUTO_INCREMENT	-	评论ID
   user_id	VARCHAR(255)	NOT NULL	-	用户ID
   user_type	INT	NOT NULL	-	用户类型
   user_name	VARCHAR(100)	NULL	-	用户名称
   for_id	INT	NOT NULL	-	所属内容id
   for_type	INT	NOT NULL	-	所属内容类型（1-文章，2-留言）
   content	VARCHAR(1000)	NOT NULL	-	内容
   complaint	INT	-	0	举报次数
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
7. 标签表 (label)
   字段名	类型	约束	默认值	说明
   id	INT	PRIMARY KEY, AUTO_INCREMENT	-	标签ID
   label_name	VARCHAR(100)	NOT NULL	-	标签名称
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
8. 日记表 (diary)
   字段名	类型	约束	默认值	说明
   id	INT	PRIMARY KEY, AUTO_INCREMENT	-	日记ID
   title	VARCHAR(200)	NOT NULL	-	标题
   content	VARCHAR(5000)	NOT NULL	-	内容
   picture	VARCHAR(500)	NULL	-	图片地址
   weather_id	INT	NULL	-	天气ID
   mood	INT	-	0	心情
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
9. 天气表 (weather)
   字段名	类型	约束	默认值	说明
   id	INT	PRIMARY KEY, AUTO_INCREMENT	-	天气ID
   weather_name	VARCHAR(32)	NOT NULL	-	天气名称
   icon	VARCHAR(100)	NULL	-	图标
   created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
   updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
10. 私信表 (private_message)
    字段名	类型	约束	默认值	说明
    id	INT	PRIMARY KEY, AUTO_INCREMENT	-	私信ID
    user_id	VARCHAR(255)	NOT NULL	-	用户ID
    user_type	INT	NOT NULL	-	用户类型
    user_name	VARCHAR(100)	NULL	-	用户名称
    content	VARCHAR(1000)	NOT NULL	-	内容
    created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
    updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
11. 埋点表 (record)
    字段名	类型	约束	默认值	说明
    id	INT	PRIMARY KEY, AUTO_INCREMENT	-	记录ID
    user_id	VARCHAR(255)	NOT NULL	-	用户ID
    user_type	INT	NOT NULL	-	用户类型
    position	VARCHAR(100)	NULL	-	位置
    isread	INT	-	0	设备
    created_at	TIMESTAMP	-	CURRENT_TIMESTAMP	创建时间
    updated_at	TIMESTAMP	-	CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间