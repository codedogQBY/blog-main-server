import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { randomInt } from 'crypto';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private generateCode() {
    return randomInt(100000, 999999).toString(); // 6 digits
  }

  async sendCode(mail: string) {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.prisma.verificationCode.create({
      data: { mail, code, expiresAt },
    });
    await this.mail.sendMail(
      mail,
      'Your verification code',
      `<h1>${code}</h1><p>Code valid for 5 minutes.</p>`,
    );
  }

  async validateCode(mail: string, code: string) {
    const record = await this.prisma.verificationCode.findFirst({
      where: { mail, code },
      orderBy: { expiresAt: 'desc' },
    });
    if (!record) throw new BadRequestException('Invalid code');
    if (record.expiresAt < new Date())
      throw new BadRequestException('Code expired');
  }
}
