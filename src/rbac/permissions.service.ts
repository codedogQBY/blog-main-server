import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Permission[]; total: number }> {
    const { page = 1, limit = 10, search } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      data: permissions,
      total,
    };
  }

  async findOne(id: string): Promise<Permission> {
    const perm = await this.prisma.permission.findUnique({ where: { id } });
    if (!perm) throw new NotFoundException('Permission not found');
    return perm;
  }

  async create(data: { name: string; code: string }): Promise<Permission> {
    const exist = await this.prisma.permission.findUnique({ where: { code: data.code } });
    if (exist) return exist;
    return this.prisma.permission.create({
      data,
    });
  }

  async update(id: string, data: { name?: string; code?: string }): Promise<Permission> {
    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Permission> {
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
