import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpyunService } from './upyun.service';
import { CreateFolderDto, UpdateFolderDto, UpdateFileDto, FileQueryDto, FolderQueryDto } from './dto/file.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upyun: UpyunService,
  ) {}

  // 文件夹管理
  async createFolder(dto: CreateFolderDto, userId: string) {
    // 生成文件夹路径
    let path = `/${dto.name}`;
    if (dto.parentId) {
      const parent = await this.prisma.fileFolder.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('父文件夹不存在');
      }
      path = `${parent.path}/${dto.name}`;
    }

    // 检查路径是否已存在
    const existing = await this.prisma.fileFolder.findUnique({
      where: { path },
    });
    if (existing) {
      throw new BadRequestException('文件夹已存在');
    }

    return this.prisma.fileFolder.create({
      data: {
        name: dto.name,
        path,
        parentId: dto.parentId,
      },
      include: {
        parent: true,
        children: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { files: true, children: true },
        },
      },
    });
  }

  async getFolders(query: FolderQueryDto) {
    const where: any = {};
    
    if (query.parentId !== undefined) {
      where.parentId = query.parentId;
    }

    if (query.search) {
      where.name = { contains: query.search };
    }

    const totalCount = await this.prisma.fileFolder.count({ where });
    
    const skip = ((query.page || 1) - 1) * (query.pageSize || 20);
    const take = query.pageSize || 20;

    const folders = await this.prisma.fileFolder.findMany({
      where,
      include: {
        parent: true,
        children: {
          orderBy: { name: 'asc' },
          take: 5, // 只显示前几个子文件夹
        },
        _count: {
          select: { files: true, children: true },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    });

    return {
      data: folders,
      total: totalCount,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      totalPages: Math.ceil(totalCount / (query.pageSize || 20)),
    };
  }

  // 获取文件夹树结构（不分页，用于导航）
  async getFolderTree() {
    const allFolders = await this.prisma.fileFolder.findMany({
      include: {
        _count: {
          select: { files: true, children: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // 构建树形结构
    const buildTree = (parentId: string | null = null) => {
      return allFolders
        .filter(folder => folder.parentId === parentId)
        .map(folder => ({
          ...folder,
          children: buildTree(folder.id),
        }));
    };

    return buildTree();
  }

  // 获取文件夹路径面包屑
  async getFolderBreadcrumb(folderId: string) {
    const breadcrumb: Array<{ id: string; name: string; parentId: string | null }> = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = await this.prisma.fileFolder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true },
      });
      
      if (folder) {
        breadcrumb.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }

    return breadcrumb;
  }

  async updateFolder(id: string, dto: UpdateFolderDto) {
    const folder = await this.prisma.fileFolder.findUnique({
      where: { id },
    });
    if (!folder) {
      throw new NotFoundException('文件夹不存在');
    }

    const updateData: any = {};
    if (dto.name) {
      updateData.name = dto.name;
      // 重新生成路径
      let path = `/${dto.name}`;
      if (dto.parentId || folder.parentId) {
        const parentId = dto.parentId !== undefined ? dto.parentId : folder.parentId;
        if (parentId) {
          const parent = await this.prisma.fileFolder.findUnique({
            where: { id: parentId },
          });
          if (!parent) {
            throw new NotFoundException('父文件夹不存在');
          }
          path = `${parent.path}/${dto.name}`;
        }
      }
      updateData.path = path;
    }
    if (dto.parentId !== undefined) {
      updateData.parentId = dto.parentId;
    }

    return this.prisma.fileFolder.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { files: true, children: true },
        },
      },
    });
  }

  async deleteFolder(id: string) {
    const folder = await this.prisma.fileFolder.findUnique({
      where: { id },
      include: {
        files: true,
        children: true,
      },
    });
    if (!folder) {
      throw new NotFoundException('文件夹不存在');
    }

    if (folder.files.length > 0 || folder.children.length > 0) {
      throw new BadRequestException('文件夹不为空，无法删除');
    }

    return this.prisma.fileFolder.delete({ where: { id } });
  }

  // 文件管理
  async uploadFile(file: Express.Multer.File, folderId: string | undefined, userId: string) {
    // 处理中文文件名编码问题
    let originalName = file.originalname;
    
    try {
      // 尝试修复可能的latin1编码问题
      // 一些浏览器/客户端可能以latin1编码发送中文文件名
      const buffer = Buffer.from(originalName, 'latin1');
      const utf8Name = buffer.toString('utf8');
      
      // 如果转换后包含中文字符且原文件名不包含中文，说明原来编码有问题
      if (/[\u4e00-\u9fff]/.test(utf8Name) && !/[\u4e00-\u9fff]/.test(originalName)) {
        originalName = utf8Name;
        console.log(`文件名编码修复: ${file.originalname} -> ${originalName}`);
      }
    } catch (error) {
      console.warn('文件名编码处理失败:', error);
    }
    
    // 生成文件路径
    const folderPath = folderId ? await this.getFolderPath(folderId) : '';
    const filePath = this.upyun.generateFilePath(originalName, folderPath);

    // 上传到又拍云
    const uploadResult = await this.upyun.uploadFile(filePath, file.buffer);
    if (!uploadResult.success) {
      throw new BadRequestException(`上传失败: ${uploadResult.error}`);
    }

    // 保存到数据库
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    return this.prisma.file.create({
      data: {
        name: originalName, // 使用修复后的文件名
        filename: filePath.split('/').pop()!,
        path: filePath,
        url: uploadResult.url!,
        size: file.size,
        mimetype: file.mimetype,
        extension,
        folderId,
        uploadedBy: userId,
      },
      include: {
        folder: true,
        uploader: {
          select: { id: true, name: true, mail: true },
        },
      },
    });
  }

  async getFiles(query: FileQueryDto) {
    const where: any = {};
    
    if (query.folderId !== undefined) {
      where.folderId = query.folderId;
    }

    if (query.search) {
      where.name = { contains: query.search };
    }

    if (query.type) {
      const typeMap = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
        audio: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
        document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
      };
      
      if (query.type === 'other') {
        const allExtensions = Object.values(typeMap).flat();
        where.extension = { notIn: allExtensions };
      } else {
        where.extension = { in: typeMap[query.type] || [] };
      }
    }

    // 计算总数
    const totalCount = await this.prisma.file.count({ where });
    
    // 分页参数
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // 排序参数
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    
    const files = await this.prisma.file.findMany({
      where,
      include: {
        folder: {
          select: { id: true, name: true, path: true },
        },
        uploader: {
          select: { id: true, name: true, mail: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
    });

    // 返回原始文件URL
    const processedFiles = files.map(file => ({
      ...file,
      url: file.url
    }));

    return {
      data: processedFiles,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      // 额外的统计信息
      stats: {
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        fileTypes: await this.getFileTypeStats(where),
      },
    };
  }

  // 获取文件类型统计
  private async getFileTypeStats(where: any) {
    const typeStats = await this.prisma.file.groupBy({
      by: ['extension'],
      where,
      _count: { extension: true },
      orderBy: { _count: { extension: 'desc' } },
      take: 10,
    });

    return typeStats.map(stat => ({
      extension: stat.extension,
      count: stat._count.extension,
    }));
  }

  async getFile(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        folder: true,
        uploader: {
          select: { id: true, name: true, mail: true },
        },
      },
    });
    
    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    // 返回原始文件URL
    return {
      ...file,
      url: file.url
    };
  }

  async updateFile(id: string, dto: UpdateFileDto) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });
    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    return this.prisma.file.update({
      where: { id },
      data: dto,
      include: {
        folder: true,
        uploader: {
          select: { id: true, name: true, mail: true },
        },
      },
    });
  }

  async deleteFile(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });
    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    // 从又拍云删除文件
    const deleteResult = await this.upyun.deleteFile(file.path);
    if (!deleteResult.success) {
      throw new BadRequestException(`删除失败: ${deleteResult.error}`);
    }

    // 从数据库删除记录
    return this.prisma.file.delete({ where: { id } });
  }

  // 辅助方法
  private async getFolderPath(folderId: string): Promise<string> {
    const folder = await this.prisma.fileFolder.findUnique({
      where: { id: folderId },
    });
    if (!folder) {
      throw new NotFoundException('文件夹不存在');
    }
    return folder.path.substring(1); // 去掉开头的 /
  }

  // 获取文件统计
  async getStats() {
    const [totalFiles, totalSize, filesByType] = await Promise.all([
      this.prisma.file.count(),
      this.prisma.file.aggregate({
        _sum: { size: true },
      }),
      this.prisma.file.groupBy({
        by: ['extension'],
        _count: { extension: true },
        orderBy: { _count: { extension: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      filesByType,
    };
  }
}