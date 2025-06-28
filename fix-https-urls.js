const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixHttpsUrls() {
  console.log('开始修复数据库中的HTTPS URL...');
  
  try {
    // 查找所有包含HTTPS的文件记录
    const filesWithHttps = await prisma.file.findMany({
      where: {
        url: {
          contains: 'https://'
        }
      }
    });
    
    console.log(`找到 ${filesWithHttps.length} 个包含HTTPS的文件记录`);
    
    if (filesWithHttps.length === 0) {
      console.log('没有需要修复的记录');
      return;
    }
    
    // 批量更新URL，将HTTPS替换为HTTP
    for (const file of filesWithHttps) {
      const newUrl = file.url.replace('https://', 'http://');
      
      await prisma.file.update({
        where: { id: file.id },
        data: { url: newUrl }
      });
      
      console.log(`修复文件: ${file.name} - ${file.url} -> ${newUrl}`);
    }
    
    console.log(`成功修复 ${filesWithHttps.length} 个文件的URL`);
    
    // 同样检查文章的封面图片
    const articlesWithHttps = await prisma.article.findMany({
      where: {
        coverImage: {
          contains: 'https://'
        }
      }
    });
    
    console.log(`找到 ${articlesWithHttps.length} 个包含HTTPS封面图片的文章`);
    
    for (const article of articlesWithHttps) {
      const newCoverImage = article.coverImage.replace('https://', 'http://');
      
      await prisma.article.update({
        where: { id: article.id },
        data: { coverImage: newCoverImage }
      });
      
      console.log(`修复文章封面: ${article.title} - ${article.coverImage} -> ${newCoverImage}`);
    }
    
    console.log(`成功修复 ${articlesWithHttps.length} 个文章的封面图片URL`);
    
  } catch (error) {
    console.error('修复过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixHttpsUrls(); 