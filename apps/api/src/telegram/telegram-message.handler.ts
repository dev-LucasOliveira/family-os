import { Injectable, Logger } from '@nestjs/common';
import { getMessages, type TelegramMessage } from '@family-os/shared';
import { env } from '../config/env';
import { HouseholdService } from '../household/household.service';
import { PersonService } from '../household/person.service';
import { MessageIntentService } from '../intents/message-intent.service';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramMessageHandler {
  private readonly messages = getMessages(env.LOCALE);
  private readonly logger = new Logger(TelegramMessageHandler.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly messageIntentService: MessageIntentService,
    private readonly householdService: HouseholdService,
    private readonly personService: PersonService,
  ) {}

  async handle(message: TelegramMessage): Promise<void> {
    this.telegramService.logIncomingMessage(message);

    const telegramChatId = message.chat.id.toString();
    const telegramUserId = message.from?.id.toString();
    const displayName =
      message.from?.first_name ??
      message.from?.username ??
      undefined;

    const [household, person] = await Promise.all([
      this.householdService.resolve(telegramChatId),
      telegramUserId
        ? this.personService.resolve(telegramUserId, displayName)
        : Promise.resolve(null),
    ]);

    this.logger.debug(`[household] id=${household.id} chat=${telegramChatId}`);

    const text = message.text?.trim();
    if (!text) {
      await this.telegramService.sendMessage(message.chat.id, this.messages.emptyMessageHint());
      return;
    }

    const reply = await this.messageIntentService.processMessage(text, {
      householdId: household.id,
      telegramUserId,
      displayName,
      personId: person?.id,
    });

    await this.telegramService.sendMessage(message.chat.id, reply);
  }
}
