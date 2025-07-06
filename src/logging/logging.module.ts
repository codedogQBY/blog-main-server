import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { LoggingService } from './logging.service';
import { AlertingService } from './alerting.service';
import { LoggingController } from './logging.controller';
import { AlertingController } from './alerting.controller';
import { PerformanceController } from './performance.controller';
import { WebSeeAdapterService } from './websee-adapter.service';
import { PerformanceService } from './performance.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [LoggingController, AlertingController, PerformanceController],
  providers: [LoggingService, AlertingService, WebSeeAdapterService, PerformanceService],
  exports: [LoggingService, AlertingService, WebSeeAdapterService, PerformanceService],
})
export class LoggingModule {} 