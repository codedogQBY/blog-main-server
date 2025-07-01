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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGroupsService } from './permission-groups.service';
import { PermissionsGuard } from '../common/permissions.guard';
import { Permissions } from '../common/permissions.decorator';
import { CreatePermissionGroupDto, UpdatePermissionGroupDto } from './dto/permission-group.dto';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('admin/permission-groups')
export class PermissionGroupsController {
  constructor(private readonly groupsService: PermissionGroupsService) {}

  @Get()
  @Permissions('permission.group.read')
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10
  ) {
    return this.groupsService.findAll(+page, +pageSize);
  }

  @Get(':id')
  @Permissions('permission.group.read')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @Permissions('permission.group.create')
  create(@Body() createPermissionGroupDto: CreatePermissionGroupDto) {
    return this.groupsService.create(createPermissionGroupDto);
  }

  @Put(':id')
  @Permissions('permission.group.update')
  update(
    @Param('id') id: string,
    @Body() updatePermissionGroupDto: UpdatePermissionGroupDto
  ) {
    return this.groupsService.update(id, updatePermissionGroupDto);
  }

  @Delete(':id')
  @Permissions('permission.group.delete')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }

  @Put(':id/sort')
  @Permissions('permission.group.update')
  updateSort(
    @Param('id') id: string,
    @Body('sort') sort: number
  ) {
    return this.groupsService.updateSort(id, sort);
  }
} 