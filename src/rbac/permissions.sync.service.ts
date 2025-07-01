import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PermissionsService } from './permissions.service';
import { PermissionGroupsService } from './permission-groups.service';

@Injectable()
export class PermissionsSyncService {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly permissionService: PermissionsService,
    private readonly groupService: PermissionGroupsService,
  ) {}

  private getControllerPermissions() {
    const controllers = this.discovery.getControllers();
    const permissions = new Set<string>();

    for (const wrapper of controllers) {
      const { instance } = wrapper;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.scanner.getAllFilteredMethodNames(prototype);

      for (const methodName of methodNames) {
        const methodRef = prototype[methodName];
        const methodPermissions = Reflect.getMetadata(PERMISSIONS_KEY, methodRef);
        if (methodPermissions) {
          for (const permission of methodPermissions) {
            permissions.add(permission);
          }
        }
      }
    }

    return Array.from(permissions);
  }

  private parsePermissionCode(code: string) {
    const parts = code.split('.');
    if (parts.length < 2) {
      return {
        group: 'other',
        name: code,
        code
      };
    }

    const groupCode = parts[0];
    const actionCode = parts[parts.length - 1];
    const resourceParts = parts.slice(1, -1);
    const resourceName = resourceParts.join('.');

    let name: string;
    let description: string;

    switch (actionCode) {
      case 'create':
        name = `创建${resourceName}`;
        description = `允许创建${resourceName}`;
        break;
      case 'read':
        name = `查看${resourceName}`;
        description = `允许查看${resourceName}`;
        break;
      case 'update':
        name = `更新${resourceName}`;
        description = `允许更新${resourceName}`;
        break;
      case 'delete':
        name = `删除${resourceName}`;
        description = `允许删除${resourceName}`;
        break;
      default:
        name = `${resourceName}${actionCode}`;
        description = `允许${resourceName}${actionCode}`;
    }

    return {
      group: groupCode,
      name,
      code,
      description
    };
  }

  private getPermissionGroups(permissions: string[]) {
    const groups = new Map<string, {
      code: string;
      name: string;
      description: string;
      sort: number;
    }>();

    permissions.forEach(code => {
      const { group: groupCode } = this.parsePermissionCode(code);
      if (!groups.has(groupCode)) {
        let name: string;
        let description: string;
        let sort: number;

        switch (groupCode) {
          case 'role':
            name = '角色管理';
            description = '角色相关权限';
            sort = 60;
            break;
          case 'permission':
            name = '权限管理';
            description = '权限相关权限';
            sort = 61;
            break;
          case 'user':
            name = '用户管理';
            description = '用户相关权限';
            sort = 62;
            break;
          case 'article':
            name = '文章管理';
            description = '文章相关权限';
            sort = 10;
            break;
          case 'category':
            name = '分类管理';
            description = '分类相关权限';
            sort = 11;
            break;
          case 'tag':
            name = '标签管理';
            description = '标签相关权限';
            sort = 12;
            break;
          case 'file':
            name = '文件管理';
            description = '文件相关权限';
            sort = 50;
            break;
          case 'gallery':
            name = '图库管理';
            description = '图库相关权限';
            sort = 20;
            break;
          case 'diary':
            name = '日记管理';
            description = '日记相关权限';
            sort = 30;
            break;
          case 'about':
            name = '关于管理';
            description = '关于页面相关权限';
            sort = 40;
            break;
          default:
            name = '其他';
            description = '其他权限';
            sort = 999;
        }

        groups.set(groupCode, {
          code: groupCode,
          name,
          description,
          sort
        });
      }
    });

    return Array.from(groups.values());
  }

  async sync() {
    const permissions = this.getControllerPermissions();
    const groups = this.getPermissionGroups(permissions);

    // 同步权限组
    const existingGroups = await this.groupService.findAll(1, 1000);
    const groupMap = new Map(
      existingGroups.items.map(g => [g.code, g.id])
    );

    for (const group of groups) {
      let groupId: string | undefined;

      if (groupMap.has(group.code)) {
        groupId = groupMap.get(group.code);
        await this.groupService.update(groupId!, {
          name: group.name,
          description: group.description,
          sort: group.sort
        });
      } else {
        const newGroup = await this.groupService.create({
          code: group.code,
          name: group.name,
          description: group.description,
          sort: group.sort
        });
        groupId = newGroup.id;
      }

      // 同步权限
      for (const code of permissions) {
        const { group: groupCode, name, description } = this.parsePermissionCode(code);
        if (groupCode !== group.code) continue;

        const existingPermission = await this.permissionService.findByCode(code);
        if (existingPermission) {
          await this.permissionService.update(existingPermission.id, {
            name,
            description,
            groupId
          });
        } else {
          await this.permissionService.create({
            code,
            name,
            description,
            groupId
          });
        }
      }
    }

    return {
      created: permissions.length,
      total: permissions.length
    };
  }
}
