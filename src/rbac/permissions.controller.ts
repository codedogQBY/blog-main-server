import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsSyncService } from './permissions.sync.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { Permissions } from '../common/permissions.decorator';

import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('admin/permission')
export class PermissionsController {
  constructor(
    private readonly service: PermissionsService,
    private readonly syncService: PermissionsSyncService,
  ) {}

  @Get()
  @Permissions('permission.read')
  findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.service.findAll({
      page: parseInt(page),
      limit: parseInt(pageSize),
      search,
      groupId,
    });
  }

  @Get(':id')
  @Permissions('permission.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('permission.create')
  create(@Body() dto: { code: string; name: string; description?: string; groupId?: string }) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Permissions('permission.update')
  update(
    @Param('id') id: string,
    @Body() dto: { code?: string; name?: string; description?: string; groupId?: string },
  ) {
    return this.service.update(id, dto);
  }

  @Post('sync')
  @Permissions('permission.sync')
  sync() {
    return this.syncService.sync();
  }

  @Delete(':id')
  @Permissions('permission.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
