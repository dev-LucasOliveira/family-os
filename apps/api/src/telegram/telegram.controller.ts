import { Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { telegramUpdateSchema } from '@family-os/shared';
import { env } from '../config/env';
import { TelegramMessageHandler } from './telegram-message.handler';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly messageHandler: TelegramMessageHandler) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Body() body: unknown,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ): Promise<{ ok: true }> {
    if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const update = telegramUpdateSchema.parse(body);

    if (update.message) {
      await this.messageHandler.handle(update.message);
    }

    return { ok: true };
  }
}
