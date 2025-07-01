import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionGroupDto, UpdatePermissionGroupDto } from './dto/permission-group.dto';

@Injectable()
export class PermissionGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePermissionGroupDto) {
    return this.prisma.permissionGroup.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        sort: dto.sort || 0,
      }
    });
  }

  async findAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.permissionGroup.findMany({
        skip,
        take: pageSize,
        orderBy: { sort: 'asc' },
        include: {
          _count: {
            select: { permissions: true }
          }
        }
      }),
      this.prisma.permissionGroup.count()
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  async findOne(id: string) {
    const group = await this.prisma.permissionGroup.findUnique({
      where: { id },
      include: {
        permissions: true,
        _count: {
          select: { permissions: true }
        }
      }
    });

    if (!group) {
      throw new NotFoundException(`权限组 ${id} 不存在`);
    }

    return group;
  }

  async update(id: string, data: Partial<CreatePermissionGroupDto>) {
    const group = await this.prisma.permissionGroup.findUnique({
      where: { id }
    });

    if (!group) {
      throw new NotFoundException(`权限组 ${id} 不存在`);
    }

    return this.prisma.permissionGroup.update({
      where: { id },
      data
    });
  }

  async remove(id: string): Promise<void> {
    const group = await this.prisma.permissionGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            permissions: true
          }
        }
      }
    });

    if (!group) {
      throw new NotFoundException(`权限组 ${id} 不存在`);
    }

    if ((group._count?.permissions ?? 0) > 0) {
      throw new Error('该权限组下还有权限，不能删除');
    }

    await this.prisma.permissionGroup.delete({
      where: { id }
    });
  }

  async updateSort(id: string, sort: number) {
    return this.prisma.permissionGroup.update({
      where: { id },
      data: { sort }
    });
  }
} 