import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission, Role } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({
      include: { perms: { include: { permission: true } } },
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

  async create(name: string): Promise<Role> {
    return this.prisma.role.create({ data: { name } });
  }

  async update(id: string, name: string): Promise<Role> {
    return this.prisma.role.update({ where: { id }, data: { name } });
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
