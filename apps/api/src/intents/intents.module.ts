import { Module } from '@nestjs/common';
import { HouseholdModule } from '../household/household.module';
import { LlmModule } from '../llm/llm.module';
import { ListsModule } from '../lists/lists.module';
import { RemindersModule } from '../reminders/reminders.module';
import { DeterministicIntentParser } from './deterministic-intent.parser';
import { IntentHandlerService } from './intent-handler.service';
import { IntentsController } from './intents.controller';
import { INTENT_PARSER } from './intent-parser.interface';
import { MessageIntentService } from './message-intent.service';

@Module({
  imports: [ListsModule, LlmModule, HouseholdModule, RemindersModule],
  controllers: [IntentsController],
  providers: [
    DeterministicIntentParser,
    IntentHandlerService,
    MessageIntentService,
    {
      provide: INTENT_PARSER,
      useExisting: DeterministicIntentParser,
    },
  ],
  exports: [INTENT_PARSER, IntentHandlerService, MessageIntentService, DeterministicIntentParser],
})
export class IntentsModule {}
