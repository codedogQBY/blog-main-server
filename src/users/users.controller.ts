import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Permissions } from '../common/permissions.decorator';
import { PermissionsGuard } from '../common/permissions.guard';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('user.read')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  @Permissions('user.read')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  @Post()
  @Permissions('user.create')
  async create(@Body() dto: {
    name: string;
    mail: string;
    password: string;
    roleId?: string;
    isSuperAdmin?: boolean;
  }) {
    const user = await this.usersService.create(dto.name, dto.mail, dto.password);
    
    // 如果指定了角色或超级管理员，需要更新
    if (dto.roleId !== undefined || dto.isSuperAdmin !== undefined) {
      return this.usersService.update(user.id, {
        roleId: dto.roleId,
        isSuperAdmin: dto.isSuperAdmin
      });
    }
    
    return this.usersService.findOne(user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      mail?: string;
      password?: string;
      roleId?: string;
      isSuperAdmin?: boolean;
    },
    @Req() req: any
  ) {
    const currentUser = req.user;
    const targetUser = await this.usersService.findOne(id);
    
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否是修改自己的信息
    const isSelf = currentUser.sub === id;
    
    // 如果是修改自己的信息
    if (isSelf) {
      // 检查用户是否有修改个人信息的权限
      if (!currentUser.permissions.includes('user.update.self') && !currentUser.isSuperAdmin) {
        throw new ForbiddenException('您没有权限修改个人信息');
      }
      
      // 普通用户不能修改自己的角色和超级管理员状态
      if ((dto.roleId !== undefined || dto.isSuperAdmin !== undefined) && !currentUser.isSuperAdmin) {
        throw new ForbiddenException('您没有权限修改自己的角色或超级管理员状态');
      }
    } else {
      // 修改其他用户的信息
      
      // 非超级管理员不能修改超级管理员
      if (targetUser.isSuperAdmin && !currentUser.isSuperAdmin) {
        throw new ForbiddenException('您没有权限修改超级管理员');
      }
      
      // 检查权限
      const hasFullUpdate = currentUser.permissions.includes('user.update') || currentUser.isSuperAdmin;
      const hasBasicUpdate = currentUser.permissions.includes('user.update.basic');
      
      if (!hasFullUpdate && !hasBasicUpdate) {
        throw new ForbiddenException('您没有权限修改其他用户信息');
      }
      
      // 基本更新权限不能修改角色和超级管理员状态
      if (hasBasicUpdate && !hasFullUpdate) {
        if (dto.roleId !== undefined || dto.isSuperAdmin !== undefined) {
          throw new ForbiddenException('您只能修改基本信息，不能修改角色或权限');
        }
      }
    }

    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('user.delete')
  async remove(@Param('id') id: string, @Req() req: any) {
    const currentUser = req.user;
    const targetUser = await this.usersService.findOne(id);
    
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    // 不能删除超级管理员（除非自己也是超级管理员）
    if (targetUser.isSuperAdmin && !currentUser.isSuperAdmin) {
      throw new ForbiddenException('您没有权限删除超级管理员');
    }

    // 不能删除自己
    if (currentUser.sub === id) {
      throw new ForbiddenException('您不能删除自己');
    }

    return this.usersService.remove(id);
  }

  @Post(':id/role')
  @Permissions('user.assign')
  async assignRole(
    @Param('id') id: string,
    @Body() dto: { roleId: string | null },
    @Req() req: any
  ) {
    const currentUser = req.user;
    const targetUser = await this.usersService.findOne(id);
    
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    // 非超级管理员不能修改超级管理员的角色
    if (targetUser.isSuperAdmin && !currentUser.isSuperAdmin) {
      throw new ForbiddenException('您没有权限修改超级管理员的角色');
    }

    // 不能修改自己的角色（防止意外移除自己的权限）
    if (currentUser.sub === id) {
      throw new ForbiddenException('您不能修改自己的角色');
    }

    return this.usersService.assignRole(id, dto.roleId);
  }
} 