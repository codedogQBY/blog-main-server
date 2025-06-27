import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany();
  }

  async findOne(id: string): Promise<Permission> {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found');
    return perm;
  }

  async create(code: string, name: string): Promise<Permission> {
    return this.prisma.permission.create({ data: { code, name } });
  }

  async update(
    id: string,
    data: { code?: string; name?: string },
  ): Promise<Permission> {
    return this.prisma.permission.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }
}
