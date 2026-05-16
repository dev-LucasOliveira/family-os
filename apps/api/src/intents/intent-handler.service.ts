import { Injectable, NotFoundException } from '@nestjs/common';
import { getMessages, type IntentResult } from '@family-os/shared';
import { env } from '../config/env';
import { ListsService } from '../lists/lists.service';
import { RemindersService } from '../reminders/reminders.service';
import { formatSpDate } from '../reminders/parse-reminder-date';

@Injectable()
export class IntentHandlerService {
  private readonly messages = getMessages(env.LOCALE);

  constructor(
    private readonly listsService: ListsService,
    private readonly remindersService: RemindersService,
  ) {}

  async execute(
    intent: IntentResult,
    householdId: string,
    personId?: string,
  ): Promise<string> {
    const { type, entities } = intent;
    const listName = entities.listName;
    const items = entities.items ?? [];

    switch (type) {
      case 'add_item': {
        if (items.length === 0 || !listName) {
          return this.messages.missingItemAndList();
        }
        await Promise.all(items.map((item) => this.listsService.addItem(householdId, listName, item)));
        if (items.length === 1) {
          return this.messages.addedItem({ item: items[0]!, listName });
        }
        return this.messages.addedItems({ items, listName });
      }

      case 'get_list': {
        if (!listName) {
          return this.messages.missingListName();
        }
        try {
          const list = await this.listsService.getList(householdId, listName);
          return this.listsService.formatListReply(listName, list.items);
        } catch (error) {
          if (error instanceof NotFoundException) {
            return this.messages.listEmpty({ listName });
          }
          throw error;
        }
      }

      case 'check_item': {
        if (items.length === 0 || !listName) {
          return this.messages.missingItemAndList();
        }
        await Promise.all(items.map((item) => this.listsService.checkItem(householdId, listName, item)));
        if (items.length === 1) {
          return this.messages.checkedItem({ item: items[0]!, listName });
        }
        return this.messages.checkedItems({ items, listName });
      }

      case 'remove_item': {
        if (items.length === 0 || !listName) {
          return this.messages.missingItemAndList();
        }
        await Promise.all(items.map((item) => this.listsService.removeItem(householdId, listName, item)));
        if (items.length === 1) {
          return this.messages.removedItem({ item: items[0]!, listName });
        }
        return this.messages.removedItems({ items, listName });
      }

      case 'clear_list': {
        if (!listName) {
          return this.messages.missingListName();
        }
        try {
          await this.listsService.clearList(householdId, listName);
          return this.messages.clearedList({ listName });
        } catch (error) {
          if (error instanceof NotFoundException) {
            return this.messages.clearListNotFound({ listName });
          }
          throw error;
        }
      }

      case 'list_all': {
        const lists = await this.listsService.getAllLists(householdId);
        if (lists.length === 0) {
          return this.messages.allListsEmpty();
        }
        return this.messages.allListsReply(lists.map((l) => l.name));
      }

      case 'create_reminder': {
        const { text, remindAt } = entities;

        if (!text) {
          return this.messages.reminderMissingText();
        }

        if (!remindAt) {
          return this.messages.reminderAmbiguousDate();
        }

        const remindAtDate = new Date(remindAt);
        if (isNaN(remindAtDate.getTime())) {
          return this.messages.reminderAmbiguousDate();
        }

        if (remindAtDate <= new Date()) {
          return this.messages.reminderPastDate();
        }

        await this.remindersService.createReminder({
          householdId,
          createdByPersonId: personId,
          text,
          remindAt: remindAtDate,
        });

        return this.messages.reminderCreated({ text, dateLabel: formatSpDate(remindAtDate) });
      }

      case 'cancel_reminder': {
        const { text } = entities;
        if (!text) return this.messages.reminderMissingText();

        const matches = await this.remindersService.findPendingByText(householdId, text);

        if (matches.length === 0) {
          return this.messages.reminderCancelNotFound({ text });
        }

        if (matches.length > 1) {
          return this.messages.reminderCancelAmbiguous(
            matches.map((r) => `${formatSpDate(r.remindAt)} — ${r.text}`),
          );
        }

        await this.remindersService.deleteReminder(matches[0]!.id);
        return this.messages.reminderCancelled({ text: matches[0]!.text });
      }

      case 'list_reminders': {
        const pending = await this.remindersService.listPendingReminders(householdId);
        if (pending.length === 0) {
          return this.messages.remindersEmpty();
        }
        return this.messages.remindersReply(
          pending.map((r) => ({ dateLabel: formatSpDate(r.remindAt), text: r.text })),
        );
      }

      default:
        return this.messages.unknownIntent();
    }
  }
}
