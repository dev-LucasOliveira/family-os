import { Inject, Injectable } from '@nestjs/common';
import type { IntentContext, IntentResult } from '@family-os/shared';
import { LLM_PROVIDER, type LLMProvider } from './llm-provider.interface';

/**
 * Facade for intent extraction via LLM. Callers use this — never Groq (or other vendors) directly.
 */
@Injectable()
export class LLMService {
  constructor(@Inject(LLM_PROVIDER) private readonly provider: LLMProvider) {}

  extractIntent(input: string, context?: IntentContext): Promise<IntentResult> {
    return this.provider.extractIntent(input, context);
  }
}
