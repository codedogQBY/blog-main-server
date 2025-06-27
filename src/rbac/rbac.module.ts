import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { RolesController } from './roles.controller';
import { PermissionsSyncService } from './permissions.sync.service';
import { PermissionsController } from './permissions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [PrismaModule, DiscoveryModule],
  controllers: [RolesController, PermissionsController],
  providers: [
    PrismaService,
    RolesService,
    PermissionsService,
    PermissionsSyncService,
  ],
  exports: [RolesService, PermissionsService],
})
export class RbacModule {}
