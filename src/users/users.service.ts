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
    const user = await this.findByEmail(mail);
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
}
