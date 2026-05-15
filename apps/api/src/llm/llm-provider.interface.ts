import type { IntentContext, IntentResult } from '@family-os/shared';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LLMProvider {
  extractIntent(input: string, context?: IntentContext): Promise<IntentResult>;
}
