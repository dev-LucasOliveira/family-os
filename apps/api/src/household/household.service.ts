import { Injectable } from '@nestjs/common';
import type { Household } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HouseholdService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(telegramChatId: string): Promise<Household> {
    return this.prisma.household.upsert({
      where: { telegramChatId },
      create: { telegramChatId },
      update: {},
    });
  }
}
