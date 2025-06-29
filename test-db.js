const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('正在测试数据库连接...');
    
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 检查用户表
    const userCount = await prisma.user.count();
    console.log(`📊 用户总数: ${userCount}`);
    
    // 列出所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        mail: true,
        isSuperAdmin: true,
        createdAt: true
      }
    });
    
    console.log('👥 用户列表:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.mail}) - 超级管理员: ${user.isSuperAdmin}`);
    });
    
    // 检查角色表
    const roleCount = await prisma.role.count();
    console.log(`📊 角色总数: ${roleCount}`);
    
    // 检查权限表
    const permissionCount = await prisma.permission.count();
    console.log(`📊 权限总数: ${permissionCount}`);
    
    // 测试默认管理员用户
    const adminUser = await prisma.user.findUnique({
      where: { mail: 'admin@admin.com' }
    });
    
    if (adminUser) {
      console.log('✅ 默认管理员用户存在');
      console.log(`  邮箱: ${adminUser.mail}`);
      console.log(`  超级管理员: ${adminUser.isSuperAdmin}`);
    } else {
      console.log('❌ 默认管理员用户不存在');
      console.log('建议运行: npx prisma db seed');
    }
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 