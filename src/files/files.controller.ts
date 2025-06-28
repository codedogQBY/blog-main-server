import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { FilesService } from './files.service';
import { UpyunService } from './upyun.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { Permissions } from '../common/permissions.decorator';
import { CreateFolderDto, UpdateFolderDto, UpdateFileDto, FileQueryDto } from './dto/file.dto';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly upyunService: UpyunService,
  ) {}

  // 又拍云文件管理 - 新增
  @Get('upyun/list')
  @Permissions('file.read')
  async listUpyunFiles(@Query('path') path: string = '/') {
    const result = await this.upyunService.listDir(path);
    if (result.success) {
      // 转换又拍云返回的数据格式
      const files = result.files?.map(file => ({
        name: file.name,
        type: file.type === 'folder' ? 'folder' : 'file',
        size: file.size || 0,
        lastModified: file.time ? new Date(file.time * 1000).toISOString() : null,
        url: file.type !== 'folder' ? this.upyunService.getFileUrl(`${path}/${file.name}`.replace('//', '/')) : null,
      })) || [];
      
      return { success: true, data: files };
    }
    return result;
  }

  @Post('upyun/upload')
  @Permissions('file.create')
  @UseInterceptors(FileInterceptor('file'))
  async uploadToUpyun(
    @UploadedFile() file: Express.Multer.File,
    @Body('path') path: string = '/',
    @Request() req,
  ) {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const filePath = this.upyunService.generateFilePath(file.originalname, path);
    const result = await this.upyunService.uploadFile(filePath, file.buffer);
    
    return result;
  }

  @Post('upyun/folder')
  @Permissions('file.create')
  async createUpyunFolder(@Body('path') path: string) {
    return await this.upyunService.makeDir(path);
  }

  @Delete('upyun/file')
  @Permissions('file.delete')
  async deleteUpyunFile(@Query('path') path: string) {
    return await this.upyunService.deleteFile(path);
  }

  @Get('upyun/info')
  @Permissions('file.read')
  async getUpyunFileInfo(@Query('path') path: string) {
    return await this.upyunService.getFileInfo(path);
  }

  @Get('upyun/download')
  @Permissions('file.read')
  async downloadUpyunFile(@Query('path') path: string, @Res() res: Response) {
    const url = this.upyunService.getFileUrl(path);
    res.redirect(url);
  }

  // 文件夹管理
  @Post('folders')
  @Permissions('file.create')
  createFolder(@Body() dto: CreateFolderDto, @Request() req) {
    return this.filesService.createFolder(dto, req.user.sub);
  }

  @Get('folders')
  @Permissions('file.read')
  getFolders(@Query('parentId') parentId?: string) {
    return this.filesService.getFolders(parentId);
  }

  @Put('folders/:id')
  @Permissions('file.update')
  updateFolder(@Param('id') id: string, @Body() dto: UpdateFolderDto) {
    return this.filesService.updateFolder(id, dto);
  }

  @Delete('folders/:id')
  @Permissions('file.delete')
  deleteFolder(@Param('id') id: string) {
    return this.filesService.deleteFolder(id);
  }

  // 文件管理
  @Post('upload')
  @Permissions('file.create')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId: string,
    @Request() req,
  ) {
    return this.filesService.uploadFile(file, folderId, req.user.sub);
  }

  @Get()
  @Permissions('file.read')
  getFiles(@Query() query: FileQueryDto) {
    return this.filesService.getFiles(query);
  }

  @Get('stats')
  @Permissions('file.read')
  getStats() {
    return this.filesService.getStats();
  }

  @Get(':id')
  @Permissions('file.read')
  getFile(@Param('id') id: string) {
    return this.filesService.getFile(id);
  }

  @Put(':id')
  @Permissions('file.update')
  updateFile(@Param('id') id: string, @Body() dto: UpdateFileDto) {
    return this.filesService.updateFile(id, dto);
  }

  @Delete(':id')
  @Permissions('file.delete')
  deleteFile(@Param('id') id: string) {
    return this.filesService.deleteFile(id);
  }
} 