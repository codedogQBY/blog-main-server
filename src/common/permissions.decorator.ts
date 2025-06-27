import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...codes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, codes);
