import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFriendLinkDto, UpdateFriendLinkDto } from './dto/friend-link.dto'

@Injectable()
export class FriendLinksService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFriendLinkDto) {
    return this.prisma.friendLink.create({
      data
    })
  }

  async findAll(params: {
    skip?: number
    take?: number
    status?: number
    search?: string
  }) {
    const { skip, take, status, search } = params
    const where = {
      ...(status !== undefined && { status }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } }
        ]
      })
    }

    const [total, items] = await Promise.all([
      this.prisma.friendLink.count({ where }),
      this.prisma.friendLink.findMany({
        where,
        skip,
        take,
        orderBy: [
          { order: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    ])

    return {
      items,
      total
    }
  }

  async findOne(id: string) {
    return this.prisma.friendLink.findUnique({
      where: { id }
    })
  }

  async update(id: string, data: UpdateFriendLinkDto) {
    return this.prisma.friendLink.update({
      where: { id },
      data
    })
  }

  async remove(id: string) {
    return this.prisma.friendLink.delete({
      where: { id }
    })
  }

  async updateOrder(id: string, order: number) {
    return this.prisma.friendLink.update({
      where: { id },
      data: { order }
    })
  }

  async updateStatus(id: string, status: number) {
    return this.prisma.friendLink.update({
      where: { id },
      data: { status }
    })
  }
} 