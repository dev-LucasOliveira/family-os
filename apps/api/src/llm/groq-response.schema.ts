import { z } from 'zod';
import type { IntentResult } from '@family-os/shared';
import { normalizeListName, splitItemNames } from '@family-os/shared';

export const GROQ_INTENT_TYPES = [
  'add_item',
  'get_list',
  'check_item',
  'remove_item',
  'list_all',
  'clear_list',
  'create_reminder',
  'list_reminders',
  'unknown',
] as const;

export const groqResponseSchema = z.object({
  type: z.enum(GROQ_INTENT_TYPES),
  entities: z
    .object({
      item: z.string().optional(),
      list: z.string().optional(),
      text: z.string().optional(),
      remindAt: z.string().optional(),
    })
    .default({}),
});

export type GroqRawResponse = z.infer<typeof groqResponseSchema>;

export const UNKNOWN_INTENT: IntentResult = {
  type: 'unknown',
  entities: {},
  confidence: 0,
  rawInput: '',
};

export function mapGroqResponseToIntentResult(
  raw: GroqRawResponse,
  input: string,
): IntentResult {
  const listName = raw.entities.list ? normalizeListName(raw.entities.list) : undefined;
  const items = raw.entities.item ? splitItemNames(raw.entities.item) : undefined;
  const text = raw.entities.text;
  const remindAt = raw.entities.remindAt;

  return {
    type: raw.type,
    entities: {
      ...(items !== undefined && { items }),
      ...(listName !== undefined && { listName }),
      ...(text !== undefined && { text }),
      ...(remindAt !== undefined && { remindAt }),
    },
    confidence: raw.type === 'unknown' ? 0 : 1,
    rawInput: input,
  };
}

export function parseGroqJson(raw: string, input: string): IntentResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...UNKNOWN_INTENT, rawInput: input };
  }

  const result = groqResponseSchema.safeParse(parsed);
  if (!result.success) {
    return { ...UNKNOWN_INTENT, rawInput: input };
  }

  return mapGroqResponseToIntentResult(result.data, input);
}
