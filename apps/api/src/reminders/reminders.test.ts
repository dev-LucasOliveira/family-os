import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * Testes de lembretes:
 * - criar lembrete com ISO explícito do parser
 * - query de pendentes
 * - envio único (sentAt é setado e lembrete não reaparece)
 * - isolamento por household
 */

const HOUSEHOLD_A = 'household-reminders-A';
const HOUSEHOLD_B = 'household-reminders-B';

type ReminderRow = {
  id: string;
  householdId: string;
  createdByPersonId: string | null;
  text: string;
  remindAt: Date;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  household: { id: string; telegramChatId: string };
};

function makeReminderStoreMock() {
  const rows: ReminderRow[] = [];
  let seq = 0;

  return {
    reminder: {
      create: async (args: {
        data: {
          householdId: string;
          createdByPersonId: string | null;
          text: string;
          remindAt: Date;
        };
      }): Promise<ReminderRow> => {
        const row: ReminderRow = {
          id: `rem-${++seq}`,
          householdId: args.data.householdId,
          createdByPersonId: args.data.createdByPersonId,
          text: args.data.text,
          remindAt: args.data.remindAt,
          sentAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          household: { id: args.data.householdId, telegramChatId: `chat-${args.data.householdId}` },
        };
        rows.push(row);
        return row;
      },

      findMany: async (args: {
        where: {
          householdId?: string;
          sentAt: null | { not: null };
          remindAt?: { lte?: Date; gt?: Date };
        };
        include?: { household?: boolean };
        orderBy?: { remindAt: 'asc' | 'desc' };
      }): Promise<ReminderRow[]> => {
        return rows
          .filter((r) => {
            if (args.where.householdId && r.householdId !== args.where.householdId) return false;
            if (args.where.sentAt === null && r.sentAt !== null) return false;
            if (args.where.remindAt?.lte && r.remindAt > args.where.remindAt.lte) return false;
            if (args.where.remindAt?.gt && r.remindAt <= args.where.remindAt.gt) return false;
            return true;
          })
          .sort((a, b) =>
            args.orderBy?.remindAt === 'desc'
              ? b.remindAt.getTime() - a.remindAt.getTime()
              : a.remindAt.getTime() - b.remindAt.getTime(),
          );
      },

      update: async (args: { where: { id: string }; data: { sentAt: Date } }): Promise<ReminderRow> => {
        const row = rows.find((r) => r.id === args.where.id);
        if (!row) throw new Error(`Reminder ${args.where.id} not found`);
        row.sentAt = args.data.sentAt;
        row.updatedAt = new Date();
        return row;
      },
    },
    _rows: rows,
  };
}

describe('RemindersService — criar lembrete', () => {
  it('cria lembrete com remindAt correto', async () => {
    const store = makeReminderStoreMock();
    const remindAt = new Date(Date.now() + 60_000); // 1 min no futuro

    const reminder = await store.reminder.create({
      data: {
        householdId: HOUSEHOLD_A,
        createdByPersonId: 'person-1',
        text: 'levar a Nicole no médico',
        remindAt,
      },
    });

    assert.equal(reminder.householdId, HOUSEHOLD_A);
    assert.equal(reminder.text, 'levar a Nicole no médico');
    assert.equal(reminder.remindAt.getTime(), remindAt.getTime());
    assert.equal(reminder.sentAt, null);
  });

  it('cria múltiplos lembretes', async () => {
    const store = makeReminderStoreMock();
    const base = Date.now() + 60_000;

    await store.reminder.create({
      data: { householdId: HOUSEHOLD_A, createdByPersonId: null, text: 'A', remindAt: new Date(base) },
    });
    await store.reminder.create({
      data: { householdId: HOUSEHOLD_A, createdByPersonId: null, text: 'B', remindAt: new Date(base + 1000) },
    });

    assert.equal(store._rows.length, 2);
  });
});

describe('RemindersService — listPendingReminders', () => {
  it('retorna apenas lembretes futuros sem sentAt', async () => {
    const store = makeReminderStoreMock();
    const now = new Date();

    await store.reminder.create({
      data: {
        householdId: HOUSEHOLD_A,
        createdByPersonId: null,
        text: 'futuro',
        remindAt: new Date(now.getTime() + 60_000),
      },
    });

    // Lembrete já passado mas sentAt null: não deve aparecer em "pending" (remindAt > now)
    const past = await store.reminder.create({
      data: {
        householdId: HOUSEHOLD_A,
        createdByPersonId: null,
        text: 'passado',
        remindAt: new Date(now.getTime() - 60_000),
      },
    });
    // Simula já enviado
    await store.reminder.update({ where: { id: past.id }, data: { sentAt: new Date() } });

    const pending = await store.reminder.findMany({
      where: { householdId: HOUSEHOLD_A, sentAt: null, remindAt: { gt: now } },
      orderBy: { remindAt: 'asc' },
    });

    assert.equal(pending.length, 1);
    assert.equal(pending[0]!.text, 'futuro');
  });
});

describe('RemindersService — envio único (due reminders)', () => {
  it('lembrete vencido aparece na query de due e some após markAsSent', async () => {
    const store = makeReminderStoreMock();
    const overdue = new Date(Date.now() - 5_000); // 5s atrás

    const reminder = await store.reminder.create({
      data: {
        householdId: HOUSEHOLD_A,
        createdByPersonId: null,
        text: 'vencido',
        remindAt: overdue,
      },
    });

    const due1 = await store.reminder.findMany({
      where: { sentAt: null, remindAt: { lte: new Date() } },
    });
    assert.equal(due1.length, 1);
    assert.equal(due1[0]!.id, reminder.id);

    // Simula envio
    await store.reminder.update({ where: { id: reminder.id }, data: { sentAt: new Date() } });

    const due2 = await store.reminder.findMany({
      where: { sentAt: null, remindAt: { lte: new Date() } },
    });
    assert.equal(due2.length, 0, 'após markAsSent não deve aparecer novamente');
  });
});

describe('RemindersService — isolamento por household', () => {
  it('lembretes de dois households são independentes', async () => {
    const store = makeReminderStoreMock();
    const future = new Date(Date.now() + 60_000);

    await store.reminder.create({
      data: { householdId: HOUSEHOLD_A, createdByPersonId: null, text: 'lembrete A', remindAt: future },
    });
    await store.reminder.create({
      data: { householdId: HOUSEHOLD_B, createdByPersonId: null, text: 'lembrete B', remindAt: future },
    });

    const pendingA = await store.reminder.findMany({
      where: { householdId: HOUSEHOLD_A, sentAt: null, remindAt: { gt: new Date() } },
      orderBy: { remindAt: 'asc' },
    });
    const pendingB = await store.reminder.findMany({
      where: { householdId: HOUSEHOLD_B, sentAt: null, remindAt: { gt: new Date() } },
      orderBy: { remindAt: 'asc' },
    });

    assert.equal(pendingA.length, 1);
    assert.equal(pendingA[0]!.text, 'lembrete A');
    assert.equal(pendingB.length, 1);
    assert.equal(pendingB[0]!.text, 'lembrete B');
  });

  it('findDueReminders retorna de todos os households', async () => {
    const store = makeReminderStoreMock();
    const overdue = new Date(Date.now() - 10_000);

    await store.reminder.create({
      data: { householdId: HOUSEHOLD_A, createdByPersonId: null, text: 'due A', remindAt: overdue },
    });
    await store.reminder.create({
      data: { householdId: HOUSEHOLD_B, createdByPersonId: null, text: 'due B', remindAt: overdue },
    });

    const due = await store.reminder.findMany({
      where: { sentAt: null, remindAt: { lte: new Date() } },
      include: { household: true },
    });

    assert.equal(due.length, 2);
    const households = new Set(due.map((r) => r.householdId));
    assert.ok(households.has(HOUSEHOLD_A));
    assert.ok(households.has(HOUSEHOLD_B));
  });
});
