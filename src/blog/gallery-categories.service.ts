import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGalleryCategoryDto,
  UpdateGalleryCategoryDto,
  GetGalleryCategoriesDto,
} from './dto/gallery.dto';

export interface GalleryCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sort: number;
  isEnabled: boolean;
  imageCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GalleryCategoriesService {
  constructor(private prisma: PrismaService) {}

  // 获取图库分类列表
  async findAll(query: GetGalleryCategoriesDto): Promise<GalleryCategory[]> {
    const { includeStats = false, enabledOnly = true } = query;

    // 获取基础分类数据
    const categories = await this.getBasicCategories(enabledOnly);

    if (includeStats) {
      // 为每个分类添加图片数量统计
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => ({
          ...category,
          imageCount: await this.getImageCountByCategory(category.name),
        })),
      );
      return categoriesWithStats;
    }

    return categories;
  }

  // 获取单个分类
  async findOne(id: string): Promise<GalleryCategory | null> {
    const category = await this.findCategoryByField('id', id);
    if (!category) return null;

    return {
      ...category,
      imageCount: await this.getImageCountByCategory(category.name),
    };
  }

  // 根据名称获取分类
  async findByName(name: string): Promise<GalleryCategory | null> {
    return this.findCategoryByField('name', name);
  }

  // 创建分类
  async create(
    createGalleryCategoryDto: CreateGalleryCategoryDto,
  ): Promise<GalleryCategory> {
    const { name, description, color, sort = 0 } = createGalleryCategoryDto;

    // 检查分类名称是否已存在
    const categories = await this.getBasicCategories(false);
    const existingCategory = categories.find(cat => cat.name === name);

    if (existingCategory) {
        if (!existingCategory.isEnabled) {
            // 如果分类存在但被禁用了，则重新启用它
            existingCategory.isEnabled = true;
            existingCategory.description = description;
            existingCategory.color = color;
            existingCategory.sort = sort;
            existingCategory.updatedAt = new Date();
            await this.saveCategory(existingCategory);
            return existingCategory;
        }
        throw new Error(`分类 "${name}" 已存在`);
    }

    const newCategory: GalleryCategory = {
        id: this.generateId(),
        name,
        description,
        color,
        sort,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // 将分类保存到系统配置中
    await this.saveCategory(newCategory);
    return newCategory;
  }

  // 更新分类
  async update(
    nameOrId: string,
    updateGalleryCategoryDto: UpdateGalleryCategoryDto,
  ): Promise<GalleryCategory> {
    // 尝试通过名称查找，如果找不到再通过ID查找
    let existingCategory = await this.findByName(nameOrId);
    if (!existingCategory) {
      existingCategory = await this.findOne(nameOrId);
    }
    
    if (!existingCategory) {
      throw new Error('分类不存在');
    }

    // 如果更新名称，检查新名称是否已被其他分类使用
    if (
      updateGalleryCategoryDto.name &&
      updateGalleryCategoryDto.name !== existingCategory.name
    ) {
      const nameExists = await this.findByName(updateGalleryCategoryDto.name);
      if (nameExists && nameExists.id !== existingCategory.id) {
        throw new Error(`分类名称 "${updateGalleryCategoryDto.name}" 已被使用`);
      }
    }

    // 直接使用updateData，无需字段映射
    const updateData = { ...updateGalleryCategoryDto };

    const updatedCategory: GalleryCategory = {
      ...existingCategory,
      ...updateData,
      updatedAt: new Date(),
    };

    await this.saveCategory(updatedCategory);
    return updatedCategory;
  }

  // 删除分类
  async remove(nameOrId: string): Promise<void> {
    // 尝试通过名称查找，如果找不到再通过ID查找
    let category = await this.findByName(nameOrId);
    if (!category) {
      category = await this.findOne(nameOrId);
    }
    
    if (!category) {
      throw new Error('分类不存在');
    }

    // 检查是否有图片使用该分类
    const imageCount = await this.getImageCountByCategory(category.name);
    if (imageCount > 0) {
      throw new Error(
        `无法删除分类 "${category.name}"，还有 ${imageCount} 张图片正在使用该分类`,
      );
    }

    await this.deleteCategory(category.id);
  }

  // 获取分类统计信息
  async getStats(): Promise<{
    totalCategories: number;
    enabledCategories: number;
    categoriesWithImages: number;
    totalImages: number;
  }> {
    const allCategories = await this.getBasicCategories(false);
    const enabledCategories = allCategories.filter((cat) => cat.isEnabled);

    let categoriesWithImages = 0;
    let totalImages = 0;

    for (const category of allCategories) {
      const imageCount = await this.getImageCountByCategory(category.name);
      if (imageCount > 0) {
        categoriesWithImages++;
      }
      totalImages += imageCount;
    }

    return {
      totalCategories: allCategories.length,
      enabledCategories: enabledCategories.length,
      categoriesWithImages,
      totalImages,
    };
  }

  // 获取管理员统计信息
  async getAdminStats(): Promise<{
    totalCategories: number;
    enabledCategories: number;
    totalImages: number;
    averageImagesPerCategory: number;
  }> {
    const stats = await this.getStats();
    
    return {
      totalCategories: stats.totalCategories,
      enabledCategories: stats.enabledCategories,
      totalImages: stats.totalImages,
      averageImagesPerCategory: stats.totalCategories > 0 
        ? Math.round((stats.totalImages / stats.totalCategories) * 10) / 10
        : 0,
    };
  }

  // 私有方法：从系统配置获取基础分类数据
  private async getBasicCategories(
    enabledOnly: boolean,
  ): Promise<GalleryCategory[]> {
    const configKey = 'gallery_categories';

    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key: configKey },
      });

      if (!config) {
        return [];
      }

      const categories: GalleryCategory[] = JSON.parse(config.value) as GalleryCategory[];

      if (enabledOnly) {
        return categories.filter((cat) => cat.isEnabled);
      }

      return categories.sort((a, b) => a.sort - b.sort);
    } catch (error) {
      console.error('获取图库分类失败:', error);
      return [];
    }
  }

  // 私有方法：根据字段查找分类
  private async findCategoryByField(
    field: 'id' | 'name',
    value: string,
  ): Promise<GalleryCategory | null> {
    const categories = await this.getBasicCategories(false);
    return categories.find((cat) => cat[field] === value) || null;
  }

  // 私有方法：保存分类到系统配置
  private async saveCategory(category: GalleryCategory): Promise<void> {
    const configKey = 'gallery_categories';
    const categories = await this.getBasicCategories(false);

    const index = categories.findIndex((cat) => cat.id === category.id);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }

    await this.prisma.systemConfig.upsert({
      where: { key: configKey },
      update: {
        value: JSON.stringify(categories.sort((a, b) => a.sort - b.sort)),
        updatedAt: new Date(),
      },
      create: {
        key: configKey,
        value: JSON.stringify([category]),
        type: 'json',
        description: '图库分类配置',
      },
    });
  }

  // 私有方法：删除分类
  private async deleteCategory(id: string): Promise<void> {
    const configKey = 'gallery_categories';
    const categories = await this.getBasicCategories(false);
    const filteredCategories = categories.filter((cat) => cat.id !== id);

    await this.prisma.systemConfig.update({
      where: { key: configKey },
      data: {
        value: JSON.stringify(filteredCategories),
        updatedAt: new Date(),
      },
    });
  }

  // 私有方法：获取指定分类的图片数量
  private async getImageCountByCategory(categoryName: string): Promise<number> {
    return this.prisma.gallery.count({
      where: { category: categoryName },
    });
  }

  // 私有方法：生成UUID
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }
} 