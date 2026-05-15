import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { IntentsModule } from './intents/intents.module';
import { ListsModule } from './lists/lists.module';
import { LlmModule } from './llm/llm.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [DatabaseModule, HealthModule, ListsModule, IntentsModule, LlmModule, TelegramModule],
})
export class AppModule {}
