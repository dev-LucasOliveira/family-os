import type { IntentContext, IntentResult } from '@family-os/shared';

export const INTENT_PARSER = Symbol('INTENT_PARSER');

export interface IntentParser {
  parse(input: string, context?: IntentContext): Promise<IntentResult>;
}
