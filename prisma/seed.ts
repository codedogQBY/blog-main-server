import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. ensure admin role exists
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  // 2. permissions list (extend as needed)
  const perms = [
    { code: 'article.create', name: 'Create Article' },
    { code: 'article.update', name: 'Update Article' },
    { code: 'article.delete', name: 'Delete Article' },
    { code: 'user.manage', name: 'User Management' },
  ];

  for (const p of perms) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  // 3. attach all permissions to admin role
  const allPerms = await prisma.permission.findMany();
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  for (const perm of allPerms) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // 4. set first user (if exists) as superAdmin and link role
  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    await prisma.user.update({
      where: { id: firstUser.id },
      data: { isSuperAdmin: true, roleId: adminRole.id },
    });
  }

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
