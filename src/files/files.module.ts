import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { UpyunService } from './upyun.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, UpyunService, PrismaService],
  exports: [FilesService, UpyunService],
})
export class FilesModule {} 