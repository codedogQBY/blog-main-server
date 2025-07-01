import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAboutDto,
  UpdateAboutDto,
  CreateAboutTagDto,
  UpdateAboutTagDto,
  CreateAboutSectionDto,
  UpdateAboutSectionDto,
  CreateAboutImageDto,
  UpdateAboutImageDto,
} from './dto/about.dto';

@Injectable()
export class AboutService {
  constructor(private prisma: PrismaService) {}

  // 获取关于页面配置（前台用）
  async getAboutConfig() {
    const about = await this.prisma.about.findFirst({
      where: { status: 'active' },
      include: {
        tags: {
          orderBy: { sort: 'asc' },
        },
        sections: {
          orderBy: { sort: 'asc' },
          include: {
            images: {
              orderBy: { sort: 'asc' },
            },
          },
        },
      },
    });

    if (!about) {
      return null;
    }

    // 格式化数据符合前台要求
    const leftTags = about.tags
      .filter((tag) => tag.position === 'left')
      .map((tag) => tag.content);
    const rightTags = about.tags
      .filter((tag) => tag.position === 'right')
      .map((tag) => tag.content);

    return {
      hero: {
        avatar: about.heroAvatar,
        signature: about.heroSignature,
        leftTags,
        rightTags,
      },
      intro: {
        title: about.introTitle,
        content: JSON.parse(about.introContent),
        logo: about.introLogo,
      },
      sections: about.sections.map((section) => ({
        id: section.id,
        title: section.title,
        content: JSON.parse(section.content),
        images: section.images.map((img) => ({
          id: img.id,
          src: img.src,
          alt: img.alt,
          caption: img.caption,
        })),
      })),
    };
  }

  // 管理端：获取所有关于页面配置
  async findAll() {
    return this.prisma.about.findMany({
      include: {
        tags: {
          orderBy: { sort: 'asc' },
        },
        sections: {
          orderBy: { sort: 'asc' },
          include: {
            images: {
              orderBy: { sort: 'asc' },
            },
          },
        },
      },
    });
  }

  // 管理端：获取单个关于页面配置
  async findOne(id: string) {
    const about = await this.prisma.about.findUnique({
      where: { id },
      include: {
        tags: {
          orderBy: { sort: 'asc' },
        },
        sections: {
          orderBy: { sort: 'asc' },
          include: {
            images: {
              orderBy: { sort: 'asc' },
            },
          },
        },
      },
    });

    if (!about) {
      throw new NotFoundException('About configuration not found');
    }

    return about;
  }

  // 管理端：创建关于页面配置
  async create(data: CreateAboutDto) {
    // 如果设置为active，需要将其他的都设置为inactive
    if (data.status === 'active') {
      await this.prisma.about.updateMany({
        where: {},
        data: { status: 'inactive' },
      });
    }

    return this.prisma.about.create({
      data: {
        ...data,
        introContent: JSON.stringify(data.introContent),
      },
    });
  }

  // 管理端：更新关于页面配置
  async update(id: string, data: UpdateAboutDto) {
    // 如果设置为active，需要将其他的都设置为inactive
    if (data.status === 'active') {
      await this.prisma.about.updateMany({
        where: { id: { not: id } },
        data: { status: 'inactive' },
      });
    }

    return this.prisma.about.update({
      where: { id },
      data: {
        ...data,
        introContent: JSON.stringify(data.introContent),
      },
    });
  }

  // 管理端：删除关于页面配置
  async remove(id: string) {
    return this.prisma.about.delete({
      where: { id },
    });
  }

  // 标签管理
  async createTag(data: CreateAboutTagDto) {
    return this.prisma.aboutTag.create({
      data: {
        content: data.content,
        position: data.position,
        sort: data.sort || 0,
        aboutId: data.aboutId!,
      },
    });
  }

  async updateTag(id: string, data: UpdateAboutTagDto) {
    return this.prisma.aboutTag.update({
      where: { id },
      data,
    });
  }

  async removeTag(id: string) {
    return this.prisma.aboutTag.delete({
      where: { id },
    });
  }

  // 批量创建标签
  async createTags(aboutId: string, tags: CreateAboutTagDto[]) {
    const createData = tags.map((tag) => ({
      ...tag,
      aboutId,
    }));

    return this.prisma.aboutTag.createMany({
      data: createData,
    });
  }

  // 章节管理
  async createSection(data: CreateAboutSectionDto) {
    return this.prisma.aboutSection.create({
      data: {
        title: data.title,
        content: JSON.stringify(data.content),
        sort: data.sort || 0,
        aboutId: data.aboutId!,
      },
    });
  }

  async updateSection(id: string, data: UpdateAboutSectionDto) {
    return this.prisma.aboutSection.update({
      where: { id },
      data: {
        ...data,
        content: JSON.stringify(data.content),
      },
    });
  }

  async removeSection(id: string) {
    return this.prisma.aboutSection.delete({
      where: { id },
    });
  }

  // 图片管理
  async createImage(data: CreateAboutImageDto) {
    return this.prisma.aboutImage.create({
      data: {
        src: data.src,
        alt: data.alt,
        caption: data.caption,
        sort: data.sort || 0,
        sectionId: data.sectionId!,
      },
    });
  }

  async updateImage(id: string, data: UpdateAboutImageDto) {
    return this.prisma.aboutImage.update({
      where: { id },
      data,
    });
  }

  async removeImage(id: string) {
    return this.prisma.aboutImage.delete({
      where: { id },
    });
  }

  // 批量创建图片
  async createImages(sectionId: string, images: CreateAboutImageDto[]) {
    const createData = images.map((image) => ({
      src: image.src,
      alt: image.alt,
      caption: image.caption,
      sort: image.sort || 0,
      sectionId,
    }));

    return this.prisma.aboutImage.createMany({
      data: createData,
    });
  }
} 