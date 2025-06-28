import { Injectable, Logger } from '@nestjs/common';
import * as upyun from 'upyun';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UpyunService {
  private readonly logger = new Logger(UpyunService.name);
  private readonly client: upyun.Client;
  private readonly domain: string;

  constructor(private readonly configService: ConfigService) {
    // 又拍云配置
    const service = new upyun.Service('beal-blog-main', 'blog', 'LT2fJpjqDCW5TpWZCjs3hWpmD8DT34HF');
    
    // 根据官方文档，Client的第二个参数是options对象
    const options = {
      domain: 'v0.api.upyun.com',  // 又拍云REST API域名
      protocol: 'http'             // 使用HTTP协议，因为是测试域名
    };
    
    this.client = new upyun.Client(service, options);
    
    this.domain = 'beal-blog-main.test.upcdn.net'; // 访问域名
  }

  /**
   * 上传文件到又拍云
   * @param path 存储路径
   * @param buffer 文件内容
   * @returns 上传结果
   */
  async uploadFile(path: string, buffer: Buffer): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // 确保路径格式正确，避免多重斜杠
      const cleanPath = this.cleanPath(path);
      
      this.logger.log(`Attempting to upload file to: ${cleanPath}`);
      
      const result = await this.client.putFile(cleanPath, buffer);
      
      if (result) {
        const url = `http://${this.domain}${cleanPath}`;  // 使用HTTP而非HTTPS
        this.logger.log(`File uploaded successfully: ${cleanPath}`);
        return { success: true, url };
      } else {
        this.logger.error(`Failed to upload file: ${cleanPath}`);
        return { success: false, error: 'Upload failed' };
      }
    } catch (error) {
      this.logger.error(`Error uploading file: ${path}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除文件
   * @param path 文件路径
   * @returns 删除结果
   */
  async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanPath = this.cleanPath(path);
      
      const result = await this.client.deleteFile(cleanPath);
      
      if (result) {
        this.logger.log(`File deleted successfully: ${cleanPath}`);
        return { success: true };
      } else {
        this.logger.error(`Failed to delete file: ${cleanPath}`);
        return { success: false, error: 'Delete failed' };
      }
    } catch (error) {
      this.logger.error(`Error deleting file: ${path}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取文件信息
   * @param path 文件路径
   * @returns 文件信息
   */
  async getFileInfo(path: string): Promise<{ success: boolean; info?: any; error?: string }> {
    try {
      const cleanPath = this.cleanPath(path);
      
      const info = await this.client.headFile(cleanPath);
      
      if (info) {
        this.logger.log(`File info retrieved: ${cleanPath}`);
        return { success: true, info };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      this.logger.error(`Error getting file info: ${path}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取目录文件列表
   * @param path 目录路径
   * @returns 文件列表
   */
  async listDir(path: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const cleanPath = this.cleanPath(path, true);
      
      this.logger.log(`Attempting to list directory: ${cleanPath}`);
      
      const result = await this.client.listDir(cleanPath);
      
      if (result && result.files) {
        this.logger.log(`Directory listed successfully: ${cleanPath}, found ${result.files.length} items`);
        return { success: true, files: result.files };
      } else {
        this.logger.warn(`Directory not found or empty: ${cleanPath}`);
        return { success: false, error: 'Directory not found or empty' };
      }
    } catch (error) {
      this.logger.error(`Error listing directory: ${path}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建目录
   * @param path 目录路径
   * @returns 创建结果
   */
  async makeDir(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanPath = this.cleanPath(path);
      
      const result = await this.client.makeDir(cleanPath);
      
      if (result) {
        this.logger.log(`Directory created successfully: ${cleanPath}`);
        return { success: true };
      } else {
        this.logger.error(`Failed to create directory: ${cleanPath}`);
        return { success: false, error: 'Create directory failed' };
      }
    } catch (error) {
      this.logger.error(`Error creating directory: ${path}`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成文件访问URL
   * @param path 文件路径
   * @returns 访问URL
   */
  getFileUrl(path: string): string {
    const cleanPath = this.cleanPath(path);
    return `http://${this.domain}${cleanPath}`;  // 使用HTTP而非HTTPS
  }

  /**
   * 生成唯一文件路径
   * @param originalName 原始文件名
   * @param folder 文件夹路径
   * @returns 唯一文件路径
   */
  generateFilePath(originalName: string, folder: string = ''): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const filename = `${timestamp}_${random}.${extension}`;
    
    if (folder) {
      // 确保文件夹路径格式正确
      const cleanFolder = folder.replace(/^\/+|\/+$/g, ''); // 移除开头和结尾的斜杠
      return `/${cleanFolder}/${filename}`;
    }
    return `/${filename}`;
  }

  /**
   * 清理路径格式
   * @param path 原始路径
   * @param isDir 是否为目录
   * @returns 清理后的路径
   */
  private cleanPath(path: string, isDir: boolean = false): string {
    if (!path) {
      return '/';
    }
    
    // 移除多余的斜杠并确保以单个斜杠开头
    let cleanPath = path.replace(/\/+/g, '/'); // 将多个斜杠替换为单个斜杠
    
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    
    // 对于根目录，直接返回 '/'
    if (cleanPath === '/' && isDir) {
      return '/';
    }
    
    // 移除结尾的斜杠（除非是根目录）
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1);
    }
    
    return cleanPath;
  }
} 