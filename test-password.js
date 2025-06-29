const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPassword() {
  try {
    console.log('正在测试密码验证...');
    
    // 获取管理员用户
    const adminUser = await prisma.user.findUnique({
      where: { mail: 'admin@admin.com' }
    });
    
    if (!adminUser) {
      console.log('❌ 管理员用户不存在');
      return;
    }
    
    console.log('✅ 找到管理员用户');
    console.log(`邮箱: ${adminUser.mail}`);
    console.log(`密码哈希: ${adminUser.passwordHash.substring(0, 20)}...`);
    
    // 测试密码验证
    const testPasswords = ['admin123', 'admin', '123456', 'password'];
    
    for (const password of testPasswords) {
      const isValid = await bcrypt.compare(password, adminUser.passwordHash);
      console.log(`密码 "${password}": ${isValid ? '✅ 正确' : '❌ 错误'}`);
    }
    
    // 重新生成正确的密码哈希
    console.log('\n重新生成密码哈希...');
    const newHash = await bcrypt.hash('admin123', 10);
    console.log(`新哈希: ${newHash.substring(0, 20)}...`);
    
    // 更新用户密码
    await prisma.user.update({
      where: { mail: 'admin@admin.com' },
      data: { passwordHash: newHash }
    });
    
    console.log('✅ 密码已更新');
    
    // 再次测试
    const updatedUser = await prisma.user.findUnique({
      where: { mail: 'admin@admin.com' }
    });
    
    const isValid = await bcrypt.compare('admin123', updatedUser.passwordHash);
    console.log(`更新后密码验证: ${isValid ? '✅ 成功' : '❌ 失败'}`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword(); 