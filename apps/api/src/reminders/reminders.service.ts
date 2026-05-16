import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async createReminder(params: {
    householdId: string;
    createdByPersonId?: string;
    text: string;
    remindAt: Date;
  }) {
    return this.prisma.reminder.create({
      data: {
        householdId: params.householdId,
        createdByPersonId: params.createdByPersonId ?? null,
        text: params.text,
        remindAt: params.remindAt,
      },
    });
  }

  async listPendingReminders(householdId: string) {
    return this.prisma.reminder.findMany({
      where: {
        householdId,
        sentAt: null,
        remindAt: { gt: new Date() },
      },
      orderBy: { remindAt: 'asc' },
    });
  }

  /** Finds reminders that are due (remindAt <= now, sentAt is null) across all households. */
  async findDueReminders() {
    return this.prisma.reminder.findMany({
      where: {
        sentAt: null,
        remindAt: { lte: new Date() },
      },
      include: { household: true },
    });
  }

  async markAsSent(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { sentAt: new Date() },
    });
  }

  /**
   * Finds pending reminders matching the given text (case-insensitive, partial).
   * Returns matched reminders for the caller to decide (cancel if exactly 1, ask if multiple).
   */
  async findPendingByText(householdId: string, text: string) {
    const all = await this.listPendingReminders(householdId);
    const lower = text.toLowerCase();
    return all.filter((r) => r.text.toLowerCase().includes(lower));
  }

  async deleteReminder(id: string) {
    return this.prisma.reminder.delete({ where: { id } });
  }
}
