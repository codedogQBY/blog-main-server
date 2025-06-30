const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // 检查是否已存在管理员用户
    const existingAdmin = await prisma.user.findUnique({
      where: { mail: 'admin@example.com' }
    })

    if (existingAdmin) {
      console.log('管理员用户已存在')
      return
    }

    // 创建管理员用户 (密码: admin123)
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        mail: 'admin@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
        isSuperAdmin: true
      }
    })

    console.log('管理员用户创建成功:', admin.mail)
    console.log('密码: admin123')
  } catch (error) {
    console.error('创建管理员用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser() 