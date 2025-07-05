import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    if (!this.config.get<string>('SMTP_HOST') ||
        !this.config.get<number>('SMTP_PORT') ||
        !this.config.get<string>('SMTP_USER') ||
        !this.config.get<string>('SMTP_PASS')) {
      throw new Error('Missing required SMTP configuration');
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST')!,
      port: this.config.get<number>('SMTP_PORT')!,
      secure: this.config.get<boolean>('SMTP_SECURE') ?? false,
      auth: {
        user: this.config.get<string>('SMTP_USER')!,
        pass: this.config.get<string>('SMTP_PASS')!,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      if (!this.config.get<string>('SMTP_FROM')) {
        throw new Error('Missing SMTP_FROM configuration');
      }

      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM')!,
        to,
        subject,
        html,
      });
    } catch (e) {
      this.logger.error(`Failed to send mail to ${to}: ${e.message}`);
      throw e;
    }
  }
}
