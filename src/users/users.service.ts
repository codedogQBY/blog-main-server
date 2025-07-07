import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(mail: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { mail } });
  }

  async create(name: string, mail: string, password: string): Promise<User> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    return this.prisma.user.create({
      data: { name, mail, passwordHash },
    });
  }

  async validateUser(mail: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ 
      where: { mail },
      include: {
        role: {
          include: {
            perms: {
              include: { permission: true }
            }
          }
        }
      }
    });
    if (!user) return null;
    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : null;
  }

  async getUserWithPerms(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            perms: {
              include: { permission: true },
            },
          },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { mail: { contains: search } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        mail: user.mail,
        isSuperAdmin: user.isSuperAdmin,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSetupAt: user.twoFactorSetupAt,
        backupCodes: user.backupCodes,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { 
        role: {
          include: {
            perms: {
              include: { permission: true }
            }
          }
        }
      }
    });
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      mail: user.mail,
      isSuperAdmin: user.isSuperAdmin,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async update(id: string, data: {
    name?: string;
    mail?: string;
    password?: string;
    roleId?: string | null;
    isSuperAdmin?: boolean;
  }) {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.mail) updateData.mail = data.mail;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.isSuperAdmin !== undefined) updateData.isSuperAdmin = data.isSuperAdmin;
    
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(data.password, salt);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true }
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async assignRole(userId: string, roleId: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: { role: true }
    });
  }

  async getStats() {
    const [total, admin, normal] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isSuperAdmin: true } }),
      this.prisma.user.count({ where: { isSuperAdmin: false } }),
    ]);

    return { total, admin, normal };
  }
}
