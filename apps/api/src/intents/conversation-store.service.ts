import { Injectable } from '@nestjs/common';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * In-memory conversation history per household.
 * Keeps the last 10 messages (5 user + 5 assistant turns) to give the LLM context
 * without bloating the prompt. Resets on server restart — acceptable for MVP.
 */
@Injectable()
export class ConversationStoreService {
  private readonly store = new Map<string, ConversationTurn[]>();
  private readonly maxTurns = 10;

  getHistory(householdId: string): ConversationTurn[] {
    return this.store.get(householdId) ?? [];
  }

  addExchange(householdId: string, userMessage: string, botReply: string): void {
    const history = this.store.get(householdId) ?? [];
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: botReply });
    while (history.length > this.maxTurns) {
      history.shift();
    }
    this.store.set(householdId, history);
  }
}
