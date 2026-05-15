import { Injectable } from '@nestjs/common';
import type { Person } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PersonService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(telegramUserId: string, displayName?: string): Promise<Person> {
    return this.prisma.person.upsert({
      where: { telegramId: telegramUserId },
      create: {
        telegramId: telegramUserId,
        displayName: displayName ?? null,
        lastSeenAt: new Date(),
      },
      update: {
        ...(displayName !== undefined && { displayName }),
        lastSeenAt: new Date(),
      },
    });
  }
}
