import { Injectable } from '@nestjs/common';
import type { IntentContext, IntentResult } from '@family-os/shared';
import type { IntentParser } from './intent-parser.interface';
import { parseDeterministicIntent } from './parse-deterministic-intent';

@Injectable()
export class DeterministicIntentParser implements IntentParser {
  async parse(input: string, _context?: IntentContext): Promise<IntentResult> {
    return parseDeterministicIntent(input);
  }
}
