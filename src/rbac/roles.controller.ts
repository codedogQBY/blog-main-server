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

@UseGuards(PermissionsGuard)
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
  create(@Body() dto: { name: string }) {
    return this.service.create(dto.name);
  }

  @Put(':id')
  @Permissions('role.update')
  update(@Param('id') id: string, @Body() dto: { name: string }) {
    return this.service.update(id, dto.name);
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
