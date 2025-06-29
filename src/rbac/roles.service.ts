import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission, Role } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      include: { 
        perms: { include: { permission: true } },
        users: true
      },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { perms: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(data: { name: string; permissionIds?: string[] }): Promise<Role> {
    // 创建角色
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
      },
    });

    // 关联权限
    if (data.permissionIds && data.permissionIds.length > 0) {
      const perms = data.permissionIds.map(pid => ({
        roleId: role.id,
        permissionId: pid,
      }));
      await this.prisma.rolePermission.createMany({ data: perms, skipDuplicates: true });
    }

    return this.findOne(role.id);
  }

  async update(id: string, data: { name?: string; permissionIds?: string[] }): Promise<Role> {
    // 更新角色基本信息
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    
    await this.prisma.role.update({ 
      where: { id }, 
      data: updateData 
    });

    // 更新权限关联
    if (data.permissionIds !== undefined) {
      // 先删除所有权限关联
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      
      // 重新关联权限
      if (data.permissionIds.length > 0) {
        const perms = data.permissionIds.map(pid => ({
          roleId: id,
          permissionId: pid,
        }));
        await this.prisma.rolePermission.createMany({ data: perms, skipDuplicates: true });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }

  async setPermissions(id: string, permissionIds: string[]): Promise<Role> {
    // disconnect all then connect
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    const data = permissionIds.map((pid) => ({
      roleId: id,
      permissionId: pid,
    }));
    await this.prisma.rolePermission.createMany({ data, skipDuplicates: true });
    return this.findOne(id);
  }
}
