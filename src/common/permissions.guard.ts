import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as {
      isSuperAdmin: boolean;
      permissions: string[];
    };
    if (!user) throw new ForbiddenException('No auth');

    if (user.isSuperAdmin) return true;
    const ok = required.every((p) => user.permissions?.includes(p));
    if (!ok) throw new ForbiddenException('No permission');
    return true;
  }
}
