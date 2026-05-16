import { Inject, Injectable, Logger } from '@nestjs/common';
import { getMessages, type IntentContext } from '@family-os/shared';
import { env } from '../config/env';
import { LLMService } from '../llm/llm.service';
import { RemindersService } from '../reminders/reminders.service';
import { ConversationStoreService } from './conversation-store.service';
import { IntentHandlerService } from './intent-handler.service';
import { INTENT_PARSER, type IntentParser } from './intent-parser.interface';

@Injectable()
export class MessageIntentService {
  private readonly logger = new Logger(MessageIntentService.name);
  private readonly messages = getMessages(env.LOCALE);

  constructor(
    @Inject(INTENT_PARSER) private readonly intentParser: IntentParser,
    private readonly intentHandler: IntentHandlerService,
    private readonly llmService: LLMService,
    private readonly conversationStore: ConversationStoreService,
    private readonly remindersService: RemindersService,
  ) {}

  async processMessage(message: string, context: IntentContext & { householdId: string }): Promise<string> {
    const { householdId, personId } = context;

    // --- Resolve pending numeric selection (e.g. user replied "1" to a disambiguation list) ---
    const numericSelection = /^\s*(\d+)\s*$/.exec(message);
    if (numericSelection) {
      const pendingOptions = this.conversationStore.getPendingCancelOptions(householdId);
      if (pendingOptions) {
        const idx = parseInt(numericSelection[1]!) - 1;
        if (idx >= 0 && idx < pendingOptions.length) {
          const chosen = pendingOptions[idx]!;
          this.conversationStore.clearPendingCancelOptions(householdId);
          await this.remindersService.deleteReminder(chosen.id);
          const reply = this.messages.reminderCancelled({ text: chosen.text });
          this.conversationStore.addExchange(householdId, message, reply);
          return reply;
        }
        // Number out of range — re-show the list
        const replyOob = `Número inválido. Escolha entre 1 e ${pendingOptions.length}.`;
        this.conversationStore.addExchange(householdId, message, replyOob);
        return replyOob;
      }
    } else {
      // Any non-numeric message clears the pending state
      this.conversationStore.clearPendingCancelOptions(householdId);
    }

    const conversationHistory = this.conversationStore.getHistory(householdId);
    const contextWithHistory: IntentContext & { householdId: string } = {
      ...context,
      conversationHistory,
    };

    let reply: string;

    if (env.LLM_PROVIDER === 'groq') {
      try {
        const intent = await this.llmService.extractIntent(message, {
          locale: env.LOCALE,
          ...contextWithHistory,
        });
        this.logger.log(`[llm] provider=groq type=${intent.type}`);
        reply = await this.intentHandler.execute(intent, householdId, personId);
      } catch (error: unknown) {
        this.logger.warn(
          `[llm] groq falhou, usando fallback determinístico: ${error instanceof Error ? error.message : error}`,
        );
        reply = await this.fallbackDeterministic(message, contextWithHistory, householdId, personId);
      }
    } else {
      reply = await this.fallbackDeterministic(message, contextWithHistory, householdId, personId);
    }

    this.conversationStore.addExchange(householdId, message, reply);
    return reply;
  }

  private async fallbackDeterministic(
    message: string,
    context: IntentContext & { householdId: string },
    householdId: string,
    personId?: string,
  ): Promise<string> {
    const intent = await this.intentParser.parse(message.trim(), {
      locale: env.LOCALE,
      ...context,
    });
    this.logger.log(`[llm] provider=deterministic type=${intent.type}`);
    return this.intentHandler.execute(intent, householdId, personId);
  }
}
