import { Module } from '@nestjs/common';
import { HouseholdModule } from '../household/household.module';
import { IntentsModule } from '../intents/intents.module';
import { TelegramController } from './telegram.controller';
import { TelegramMessageHandler } from './telegram-message.handler';
import { TelegramService } from './telegram.service';

@Module({
  imports: [IntentsModule, HouseholdModule],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramMessageHandler],
})
export class TelegramModule {}
