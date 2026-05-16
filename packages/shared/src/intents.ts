export type IntentType =
  | 'add_item'
  | 'get_list'
  | 'list_all'
  | 'check_item'
  | 'remove_item'
  | 'clear_list'
  | 'create_reminder'
  | 'list_reminders'
  | 'cancel_reminder'
  | 'unknown';

export interface IntentEntities {
  /** @deprecated Use `items` — mantido para compatibilidade com testes antigos de item único. */
  item?: string;
  items?: string[];
  listName?: string;
  /** Texto do lembrete */
  text?: string;
  /** ISO 8601 datetime do lembrete (ex: "2026-05-16T08:00:00-03:00") */
  remindAt?: string;
}

export interface IntentResult {
  type: IntentType;
  entities: IntentEntities;
  confidence: number;
  rawInput: string;
}

export interface IntentContext {
  telegramUserId?: string;
  displayName?: string;
  locale?: string;
  householdId?: string;
  /** ID interno do Person no Prisma (não o telegramUserId) */
  personId?: string;
  /** Histórico recente da conversa para contexto multi-turn */
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
