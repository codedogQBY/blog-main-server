import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'
import { CreateFriendLinkDto, UpdateFriendLinkDto, ApplyFriendLinkDto, AuditFriendLinkDto } from './dto/friend-link.dto'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class FriendLinksService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async create(createFriendLinkDto: CreateFriendLinkDto) {
    return this.prisma.friendLink.create({
      data: createFriendLinkDto,
    })
  }

  async findAll({ skip = 0, take = 10, status, search }: { skip?: number; take?: number; status?: number; search?: string }) {
    const where = {
      ...(typeof status !== 'undefined' && { status }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      this.prisma.friendLink.findMany({
        where,
        skip,
        take,
        orderBy: [
          { order: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.friendLink.count({ where }),
    ])

    return { items, total }
  }

  async findOne(id: string) {
    return this.prisma.friendLink.findUnique({
      where: { id }
    })
  }

  async update(id: string, updateFriendLinkDto: UpdateFriendLinkDto) {
    return this.prisma.friendLink.update({
      where: { id },
      data: updateFriendLinkDto,
    })
  }

  async remove(id: string) {
    return this.prisma.friendLink.delete({
      where: { id },
    })
  }

  async updateOrder(id: string, order: number) {
    return this.prisma.friendLink.update({
      where: { id },
      data: { order },
    })
  }

  async updateStatus(id: string, status: number) {
    return this.prisma.friendLink.update({
      where: { id },
      data: { status },
    })
  }

  async applyFriendLink(applyFriendLinkDto: ApplyFriendLinkDto) {
    const friendLink = await this.prisma.friendLink.create({
      data: {
        ...applyFriendLinkDto,
        status: 0, // 默认禁用
        auditStatus: 0, // 待审核
      },
    })

    // 发送邮件通知站长
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL')
    if (adminEmail) {
      await this.mailService.sendMail(
        adminEmail,
        '新的友链申请',
        `
          <h3>新的友链申请</h3>
          <p>网站名称：${friendLink.name}</p>
          <p>网站链接：${friendLink.url}</p>
          <p>网站Logo：${friendLink.logo || '无'}</p>
          <p>网站描述：${friendLink.description || '无'}</p>
          <p>申请人邮箱：${friendLink.email}</p>
          <p>请登录后台管理系统审核。</p>
        `
      )
    }

    return friendLink
  }

  async audit(id: string, { auditStatus }: AuditFriendLinkDto) {
    const friendLink = await this.prisma.friendLink.update({
      where: { id },
      data: {
        auditStatus,
        status: auditStatus === 1 ? 1 : 0, // 如果审核通过，则自动启用
      },
    })

    // 发送邮件通知申请人
    if (friendLink.email) {
      const auditStatusText = {
        1: '通过',
        2: '拒绝',
      }[auditStatus]

      if (auditStatusText) {
        await this.mailService.sendMail(
          friendLink.email,
          `友链申请${auditStatusText}通知`,
          `
            <h3>友链申请${auditStatusText}通知</h3>
            <p>您申请的友链已${auditStatusText}：</p>
            <p>网站名称：${friendLink.name}</p>
            <p>网站链接：${friendLink.url}</p>
            ${auditStatus === 2 ? '<p>如有疑问，请回复此邮件。</p>' : ''}
          `
        )
      }
    }

    return friendLink
  }
} 