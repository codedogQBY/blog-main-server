import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    groupId?: string;
  }) {
    const { page, limit, search, groupId } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
      ...(groupId ? { groupId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { roles: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.permission.count({ where }),
    ]);

    const itemsWithGroup = await Promise.all(
      items.map(async (item) => {
        if (!item.groupId) return item;
        const group = await this.prisma.permissionGroup.findUnique({
          where: { id: item.groupId },
          select: { name: true },
        });
        return {
          ...item,
          groupName: group?.name,
        };
      })
    );

    return {
      items: itemsWithGroup,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Permission> {
    const perm = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        group: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });
    if (!perm) throw new NotFoundException('权限不存在');
    return perm;
  }

  async create(data: {
    name: string;
    code: string;
    description?: string;
    groupId?: string | null;
  }): Promise<Permission> {
    const exist = await this.prisma.permission.findUnique({
      where: { code: data.code }
    });

    if (exist) {
      throw new Error('权限代码已存在');
    }

    if (data.groupId) {
      const group = await this.prisma.permissionGroup.findUnique({
        where: { id: data.groupId }
      });
      if (!group) {
        throw new NotFoundException(`权限组 ${data.groupId} 不存在`);
      }
    }

    return this.prisma.permission.create({
      data: {
        ...data,
        groupId: data.groupId === null ? null : data.groupId
      }
    });
  }

  async update(id: string, data: {
    name?: string;
    code?: string;
    description?: string;
    groupId?: string | null;
  }) {
    const permission = await this.prisma.permission.findUnique({
      where: { id }
    });

    if (!permission) {
      throw new NotFoundException(`权限 ${id} 不存在`);
    }

    if (data.code && data.code !== permission.code) {
      const exist = await this.prisma.permission.findUnique({
        where: { code: data.code }
      });
      if (exist) throw new Error('权限代码已存在');
    }

    if (data.groupId) {
      const group = await this.prisma.permissionGroup.findUnique({
        where: { id: data.groupId }
      });
      if (!group) {
        throw new NotFoundException(`权限组 ${data.groupId} 不存在`);
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        groupId: data.groupId === null ? null : data.groupId
      },
      include: {
        _count: {
          select: { roles: true }
        }
      }
    });
  }

  async remove(id: string): Promise<void> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: true
      }
    });

    if (!permission) {
      throw new NotFoundException(`权限 ${id} 不存在`);
    }

    if (permission.roles?.length > 0) {
      throw new Error('该权限已被角色使用，不能删除');
    }

    await this.prisma.permission.delete({
      where: { id }
    });
  }

  async batchUpdateGroup(ids: string[], groupId: string | null): Promise<void> {
    await this.prisma.permission.updateMany({
      where: { id: { in: ids } },
      data: { groupId }
    });
  }

  async findByCode(code: string) {
    return this.prisma.permission.findUnique({
      where: { code }
    });
  }
}
