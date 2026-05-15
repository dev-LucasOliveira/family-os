import { Injectable, Logger } from '@nestjs/common';
import type { TelegramMessage } from '@family-os/shared';
import { env } from '../config/env';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly apiBase = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

  logIncomingMessage(message: TelegramMessage): void {
    const from = message.from?.username ?? message.from?.first_name ?? 'unknown';
    this.logger.log(
      `Telegram message ${message.message_id} from ${from} in chat ${message.chat.id}: ${message.text ?? '(no text)'}`,
    );
  }

  async sendMessage(chatId: number, text: string): Promise<void> {
    const response = await fetch(`${this.apiBase}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Telegram sendMessage failed: ${response.status} ${body}`);
      throw new Error(`Failed to send Telegram message: ${response.status}`);
    }
  }
}
