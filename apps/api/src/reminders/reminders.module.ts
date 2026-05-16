import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TelegramService } from '../telegram/telegram.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { RemindersService } from './reminders.service';

@Module({
  imports: [DatabaseModule],
  providers: [RemindersService, ReminderSchedulerService, TelegramService],
  exports: [RemindersService],
})
export class RemindersModule {}
