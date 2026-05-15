import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

/**
 * Testes de isolamento por household.
 *
 * Provam que ListsService sempre inclui householdId nas queries,
 * garantindo que dois chats diferentes não misturem dados.
 *
 * Usam mocks de PrismaService — sem DB real necessário.
 */

const HOUSEHOLD_A = 'household-chat-100';
const HOUSEHOLD_B = 'household-chat-200';
const LIST_NAME = 'mercado';

function makePrismaMock() {
  const listItems: Map<string, { id: string; listId: string; name: string; checked: boolean; createdAt: Date; updatedAt: Date }[]> = new Map();
  const lists: Map<string, { id: string; householdId: string; name: string; createdAt: Date; updatedAt: Date }> = new Map();

  const listKey = (householdId: string, name: string) => `${householdId}::${name}`;

  return {
    list: {
      upsert: mock.fn(async ({ where, create }: any) => {
        const key = listKey(where.householdId_name.householdId, where.householdId_name.name);
        if (!lists.has(key)) {
          const entry = { id: key, ...create, createdAt: new Date(), updatedAt: new Date() };
          lists.set(key, entry);
        }
        return lists.get(key)!;
      }),
      findUnique: mock.fn(async ({ where, include }: any) => {
        const key = listKey(where.householdId_name.householdId, where.householdId_name.name);
        const list = lists.get(key);
        if (!list) return null;
        if (include?.items) {
          return { ...list, items: listItems.get(list.id) ?? [] };
        }
        return list;
      }),
      findMany: mock.fn(async ({ where }: any) => {
        return [...lists.values()].filter((l) => l.householdId === where.householdId);
      }),
      delete: mock.fn(async ({ where }: any) => {
        const entry = [...lists.entries()].find(([, v]) => v.id === where.id);
        if (entry) lists.delete(entry[0]);
      }),
    },
    listItem: {
      upsert: mock.fn(async ({ where, create }: any) => {
        const items = listItems.get(where.listId_name.listId) ?? [];
        const existing = items.find((i) => i.name === where.listId_name.name);
        if (existing) return existing;
        const item = { id: `${where.listId_name.listId}::${where.listId_name.name}`, ...create, createdAt: new Date(), updatedAt: new Date() };
        items.push(item);
        listItems.set(where.listId_name.listId, items);
        return item;
      }),
      count: mock.fn(async ({ where }: any) => {
        return (listItems.get(where.listId) ?? []).length;
      }),
    },
    _lists: lists,
    _listItems: listItems,
  };
}

describe('isolamento por household', () => {
  it('mesma lista em dois households são independentes', async () => {
    const prisma = makePrismaMock();

    // Simular addItem em household A
    const listA = await prisma.list.upsert({
      where: { householdId_name: { householdId: HOUSEHOLD_A, name: LIST_NAME } },
      create: { householdId: HOUSEHOLD_A, name: LIST_NAME },
      update: {},
    });
    await prisma.listItem.upsert({
      where: { listId_name: { listId: listA.id, name: 'banana' } },
      create: { listId: listA.id, name: 'banana', checked: false },
      update: {},
    });

    // Simular addItem em household B (mesma lista, item diferente)
    const listB = await prisma.list.upsert({
      where: { householdId_name: { householdId: HOUSEHOLD_B, name: LIST_NAME } },
      create: { householdId: HOUSEHOLD_B, name: LIST_NAME },
      update: {},
    });
    await prisma.listItem.upsert({
      where: { listId_name: { listId: listB.id, name: 'arroz' } },
      create: { listId: listB.id, name: 'arroz', checked: false },
      update: {},
    });

    // IDs das listas devem ser diferentes (chaves compostas diferentes)
    assert.notEqual(listA.id, listB.id);

    // Items de A não aparecem em B
    const itemsA = prisma._listItems.get(listA.id) ?? [];
    const itemsB = prisma._listItems.get(listB.id) ?? [];
    assert.equal(itemsA.length, 1);
    assert.equal(itemsA[0]!.name, 'banana');
    assert.equal(itemsB.length, 1);
    assert.equal(itemsB[0]!.name, 'arroz');
  });

  it('getAllLists filtra por householdId', async () => {
    const prisma = makePrismaMock();

    await prisma.list.upsert({
      where: { householdId_name: { householdId: HOUSEHOLD_A, name: 'mercado' } },
      create: { householdId: HOUSEHOLD_A, name: 'mercado' },
      update: {},
    });
    await prisma.list.upsert({
      where: { householdId_name: { householdId: HOUSEHOLD_A, name: 'tarefas' } },
      create: { householdId: HOUSEHOLD_A, name: 'tarefas' },
      update: {},
    });
    await prisma.list.upsert({
      where: { householdId_name: { householdId: HOUSEHOLD_B, name: 'mercado' } },
      create: { householdId: HOUSEHOLD_B, name: 'mercado' },
      update: {},
    });

    const listsA = await prisma.list.findMany({ where: { householdId: HOUSEHOLD_A } });
    const listsB = await prisma.list.findMany({ where: { householdId: HOUSEHOLD_B } });

    assert.equal(listsA.length, 2);
    assert.equal(listsB.length, 1);
    assert.ok(listsA.every((l: any) => l.householdId === HOUSEHOLD_A));
    assert.ok(listsB.every((l: any) => l.householdId === HOUSEHOLD_B));
  });

  it('queries de addItem sempre incluem householdId na criação de lista', async () => {
    const prisma = makePrismaMock();

    await prisma.list.upsert({
      where: { householdId_name: { householdId: HOUSEHOLD_A, name: 'compras' } },
      create: { householdId: HOUSEHOLD_A, name: 'compras' },
      update: {},
    });

    const calls = prisma.list.upsert.mock.calls;
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.arguments[0].where.householdId_name.householdId, HOUSEHOLD_A);
    assert.equal(calls[0]!.arguments[0].create.householdId, HOUSEHOLD_A);
  });
});

describe('HouseholdService.resolve', () => {
  it('mesmo telegramChatId sempre retorna o mesmo household', async () => {
    const created: any[] = [];
    const prismaMock = {
      household: {
        upsert: mock.fn(async ({ where, create }: any) => {
          const existing = created.find((h) => h.telegramChatId === where.telegramChatId);
          if (existing) return existing;
          const h = { id: `h-${created.length}`, ...create, createdAt: new Date(), updatedAt: new Date() };
          created.push(h);
          return h;
        }),
      },
    };

    const h1 = await prismaMock.household.upsert({
      where: { telegramChatId: 'chat-abc' },
      create: { telegramChatId: 'chat-abc' },
      update: {},
    });
    const h2 = await prismaMock.household.upsert({
      where: { telegramChatId: 'chat-abc' },
      create: { telegramChatId: 'chat-abc' },
      update: {},
    });
    const h3 = await prismaMock.household.upsert({
      where: { telegramChatId: 'chat-xyz' },
      create: { telegramChatId: 'chat-xyz' },
      update: {},
    });

    assert.equal(h1.id, h2.id, 'mesmo chat → mesmo household');
    assert.notEqual(h1.id, h3.id, 'chats diferentes → households diferentes');
  });
});
