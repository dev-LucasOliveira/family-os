import { Injectable } from '@nestjs/common';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface PendingCancelOption {
  id: string;
  text: string;
  remindAt: Date;
}

/**
 * In-memory conversation history + pending action state per household.
 * Resets on server restart — acceptable for MVP.
 */
@Injectable()
export class ConversationStoreService {
  private readonly history = new Map<string, ConversationTurn[]>();
  private readonly pendingCancel = new Map<string, PendingCancelOption[]>();
  private readonly maxTurns = 10;

  getHistory(householdId: string): ConversationTurn[] {
    return this.history.get(householdId) ?? [];
  }

  addExchange(householdId: string, userMessage: string, botReply: string): void {
    const turns = this.history.get(householdId) ?? [];
    turns.push({ role: 'user', content: userMessage });
    turns.push({ role: 'assistant', content: botReply });
    while (turns.length > this.maxTurns) {
      turns.shift();
    }
    this.history.set(householdId, turns);
  }

  setPendingCancelOptions(householdId: string, options: PendingCancelOption[]): void {
    this.pendingCancel.set(householdId, options);
  }

  getPendingCancelOptions(householdId: string): PendingCancelOption[] | null {
    return this.pendingCancel.get(householdId) ?? null;
  }

  clearPendingCancelOptions(householdId: string): void {
    this.pendingCancel.delete(householdId);
  }
}
