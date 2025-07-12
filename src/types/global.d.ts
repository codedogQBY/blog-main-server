import { Request as ExpressRequest } from 'express';

declare global {
  namespace Express {
    interface Request extends ExpressRequest {
      headers: any;
      ip: string;
      connection: any;
      socket: any;
    }
  }
}

declare module '@prisma/client' {
  interface PrismaClient {
    user: any;
    systemConfig: any;
    verificationCode: any;
    $disconnect(): Promise<void>;
  }
}