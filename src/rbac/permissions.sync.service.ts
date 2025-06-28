import { Injectable, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { PERMISSIONS_KEY } from '../common/permissions.decorator';

@Injectable()
export class PermissionsSyncService {
  private readonly logger = new Logger('PermissionsSync');
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly permService: PermissionsService,
    private readonly scanner: MetadataScanner,
  ) {}

  async sync() {
    const codes = new Set<string>();
    const controllers = this.discovery.getControllers();
    controllers.forEach((wrapper) => {
      const { instance } = wrapper;
      if (!instance) return;
      const prototype = Object.getPrototypeOf(instance);
      this.scanner.scanFromPrototype(instance, prototype, (key) => {
        const perms: string[] = this.reflector.get(PERMISSIONS_KEY, instance[key]);
        if (perms) perms.forEach((p) => codes.add(p));
      });
    });

    const list = Array.from(codes);
    const existingResult = await this.permService.findAll();
    const existing = Array.isArray(existingResult) ? existingResult : existingResult.data;
    const existingCodes = new Set(existing.map((p) => p.code));
    const toCreate = list.filter((c) => !existingCodes.has(c));
    for (const code of toCreate) {
      await this.permService.create({ code, name: code });
    }
    this.logger.log(`Synced permissions. new: ${toCreate.length}, total: ${list.length}`);
    return { created: toCreate.length, total: list.length };
  }
}
