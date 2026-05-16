import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IntentContext } from '@family-os/shared';
import { env } from '../config/env';
import { LLMService } from '../llm/llm.service';
import { IntentHandlerService } from './intent-handler.service';
import { INTENT_PARSER, type IntentParser } from './intent-parser.interface';

@Injectable()
export class MessageIntentService {
  private readonly logger = new Logger(MessageIntentService.name);

  constructor(
    @Inject(INTENT_PARSER) private readonly intentParser: IntentParser,
    private readonly intentHandler: IntentHandlerService,
    private readonly llmService: LLMService,
  ) {}

  async processMessage(message: string, context: IntentContext & { householdId: string }): Promise<string> {
    const { householdId, personId } = context;

    if (env.LLM_PROVIDER === 'groq') {
      try {
        const intent = await this.llmService.extractIntent(message, {
          locale: env.LOCALE,
          ...context,
        });
        this.logger.log(`[llm] provider=groq type=${intent.type}`);
        return this.intentHandler.execute(intent, householdId, personId);
      } catch (error: unknown) {
        this.logger.warn(
          `[llm] groq falhou, usando fallback determinístico: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    const intent = await this.intentParser.parse(message.trim(), {
      locale: env.LOCALE,
      ...context,
    });
    this.logger.log(`[llm] provider=deterministic type=${intent.type}`);
    return this.intentHandler.execute(intent, householdId, personId);
  }
}
