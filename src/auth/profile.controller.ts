import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@UseGuards(AuthGuard('jwt'))
@Controller('profile')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getProfile(@Req() req: any) {
    const currentUser = req.user;
    const profile = await this.usersService.findOne(currentUser.sub);
    
    if (!profile) {
      throw new BadRequestException('用户不存在');
    }
    
    return profile;
  }

  @Put()
  async updateProfile(
    @Body() dto: {
      name?: string;
      password?: string;
    },
    @Req() req: any
  ) {
    const currentUser = req.user;
    
    // 验证输入数据
    if (!dto.name && !dto.password) {
      throw new BadRequestException('请提供要更新的字段');
    }
    
    // 验证用户名
    if (dto.name !== undefined) {
      if (typeof dto.name !== 'string' || dto.name.trim().length < 2 || dto.name.trim().length > 20) {
        throw new BadRequestException('用户名长度应为2-20个字符');
      }
      dto.name = dto.name.trim();
    }
    
    // 验证密码
    if (dto.password !== undefined) {
      if (typeof dto.password !== 'string' || dto.password.length < 6 || dto.password.length > 20) {
        throw new BadRequestException('密码长度应为6-20个字符');
      }
    }
    
    // 只允许修改用户名和密码，确保不会有其他字段
    const updateData: { name?: string; password?: string } = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.password !== undefined) updateData.password = dto.password;
    
    // 更新用户信息
    const updatedUser = await this.usersService.update(currentUser.sub, updateData);
    
    // 返回更新后的用户信息（不包含敏感数据）
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      mail: updatedUser.mail,
      isSuperAdmin: updatedUser.isSuperAdmin,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  }
}