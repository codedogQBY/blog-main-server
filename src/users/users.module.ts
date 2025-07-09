import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserInfoController } from './user-info.controller';
import { UserInfoService } from './user-info.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, UserInfoController],
  providers: [UsersService, UserInfoService],
  exports: [UsersService, UserInfoService],
})
export class UsersModule {}
