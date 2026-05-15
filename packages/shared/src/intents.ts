export type IntentType =
  | 'add_item'
  | 'get_list'
  | 'list_all'
  | 'check_item'
  | 'remove_item'
  | 'clear_list'
  | 'unknown';

export interface IntentEntities {
  /** @deprecated Use `items` — mantido para compatibilidade com testes antigos de item único. */
  item?: string;
  items?: string[];
  listName?: string;
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
}
