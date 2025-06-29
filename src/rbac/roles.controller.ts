import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Permissions } from '../common/permissions.decorator';
import { PermissionsGuard } from '../common/permissions.guard';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @Permissions('role.read')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('role.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('role.create')
  create(@Body() dto: any) {
    // 处理前端传来的嵌套数据结构
    const data = dto.name && typeof dto.name === 'object' ? dto.name : dto;
    return this.service.create({
      name: data.name,
      permissionIds: data.permissionIds
    });
  }

  @Put(':id')
  @Permissions('role.update')
  update(@Param('id') id: string, @Body() dto: any) {
    // 处理前端传来的嵌套数据结构
    const data = dto.name && typeof dto.name === 'object' ? dto.name : dto;
    return this.service.update(id, {
      name: data.name,
      permissionIds: data.permissionIds
    });
  }

  @Delete(':id')
  @Permissions('role.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/permissions')
  @Permissions('role.assign')
  setPerms(@Param('id') id: string, @Body() dto: { permissionIds: string[] }) {
    return this.service.setPermissions(id, dto.permissionIds);
  }
}
