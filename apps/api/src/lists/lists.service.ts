import { Injectable, NotFoundException } from '@nestjs/common';
import { getMessages, normalizeListName } from '@family-os/shared';
import type { List, ListItem } from '@prisma/client';
import { env } from '../config/env';
import { PrismaService } from '../database/prisma.service';

export interface ListWithItems extends List {
  items: ListItem[];
}

@Injectable()
export class ListsService {
  private readonly messages = getMessages(env.LOCALE);

  constructor(private readonly prisma: PrismaService) {}

  private normalizeName(name: string): string {
    return normalizeListName(name);
  }

  private async findOrCreateList(householdId: string, listName: string): Promise<List> {
    const name = this.normalizeName(listName);
    return this.prisma.list.upsert({
      where: { householdId_name: { householdId, name } },
      create: { householdId, name },
      update: {},
    });
  }

  async addItem(householdId: string, listName: string, itemName: string): Promise<ListItem> {
    const list = await this.findOrCreateList(householdId, listName);
    const name = itemName.trim();

    return this.prisma.listItem.upsert({
      where: { listId_name: { listId: list.id, name } },
      create: { listId: list.id, name, checked: false },
      update: { checked: false },
    });
  }

  async getList(householdId: string, listName: string): Promise<ListWithItems> {
    const name = this.normalizeName(listName);
    const list = await this.prisma.list.findUnique({
      where: { householdId_name: { householdId, name } },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });

    if (!list) {
      throw new NotFoundException(this.messages.listNotFound({ listName }));
    }

    return list;
  }

  async checkItem(householdId: string, listName: string, itemName: string): Promise<ListItem> {
    const list = await this.getList(householdId, listName);
    const name = itemName.trim();

    const item = await this.prisma.listItem.findUnique({
      where: { listId_name: { listId: list.id, name } },
    });

    if (!item) {
      throw new NotFoundException(this.messages.itemNotFound({ item: itemName, listName }));
    }

    return this.prisma.listItem.update({
      where: { id: item.id },
      data: { checked: true },
    });
  }

  async removeItem(householdId: string, listName: string, itemName: string): Promise<void> {
    const list = await this.getList(householdId, listName);
    const name = itemName.trim();

    const item = await this.prisma.listItem.findUnique({
      where: { listId_name: { listId: list.id, name } },
    });

    if (!item) {
      throw new NotFoundException(this.messages.itemNotFound({ item: itemName, listName }));
    }

    await this.prisma.listItem.delete({ where: { id: item.id } });

    const remaining = await this.prisma.listItem.count({ where: { listId: list.id } });
    if (remaining === 0) {
      await this.prisma.list.delete({ where: { id: list.id } });
    }
  }

  async clearList(householdId: string, listName: string): Promise<void> {
    const name = this.normalizeName(listName);
    const list = await this.prisma.list.findUnique({
      where: { householdId_name: { householdId, name } },
    });
    if (!list) {
      throw new NotFoundException(this.messages.listNotFound({ listName }));
    }
    await this.prisma.list.delete({ where: { id: list.id } });
  }

  async getAllLists(householdId: string): Promise<List[]> {
    return this.prisma.list.findMany({
      where: { householdId },
      orderBy: { name: 'asc' },
    });
  }

  formatListReply(listName: string, items: ListItem[]): string {
    if (items.length === 0) {
      return this.messages.listEmpty({ listName });
    }

    const lines = items.map((item) => {
      const marker = item.checked ? '✓' : '○';
      return `${marker} ${item.name}`;
    });

    return `${this.messages.listHeader({ listName })}\n${lines.join('\n')}`;
  }
}
