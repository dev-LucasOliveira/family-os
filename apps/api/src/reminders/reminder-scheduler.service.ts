import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';
import { TelegramService } from '../telegram/telegram.service';
import { ptBrMessages } from '@family-os/shared';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly remindersService: RemindersService,
    private readonly telegramService: TelegramService,
  ) {}

  @Cron('* * * * *')
  async dispatchDueReminders(): Promise<void> {
    const due = await this.remindersService.findDueReminders();
    if (due.length === 0) return;

    this.logger.log(`Dispatching ${due.length} due reminder(s)`);

    await Promise.allSettled(
      due.map(async (reminder) => {
        const chatId = parseInt(reminder.household.telegramChatId, 10);
        const text = ptBrMessages.reminderNotification({ text: reminder.text });
        try {
          await this.telegramService.sendMessage(chatId, text);
          await this.remindersService.markAsSent(reminder.id);
          this.logger.log(`Sent reminder ${reminder.id} to chat ${chatId}`);
        } catch (err) {
          this.logger.error(`Failed to send reminder ${reminder.id}: ${String(err)}`);
        }
      }),
    );
  }
}
