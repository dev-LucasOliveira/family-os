import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { HouseholdService } from '../household/household.service';
import { PersonService } from '../household/person.service';
import { MessageIntentService } from './message-intent.service';

const testIntentBodySchema = z.object({
  message: z.string().min(1, 'message is required'),
  telegramChatId: z.string().min(1, 'telegramChatId is required'),
  telegramUserId: z.string().optional().default('local-user'),
  displayName: z.string().optional().default('Local User'),
});

@Controller('intents')
export class IntentsController {
  constructor(
    private readonly messageIntentService: MessageIntentService,
    private readonly householdService: HouseholdService,
    private readonly personService: PersonService,
  ) {}

  @Post('test')
  async test(@Body() body: unknown): Promise<{ reply: string }> {
    const parsed = testIntentBodySchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new BadRequestException(details);
    }

    const { message, telegramChatId, telegramUserId, displayName } = parsed.data;

    const [household, person] = await Promise.all([
      this.householdService.resolve(telegramChatId),
      this.personService.resolve(telegramUserId, displayName),
    ]);

    const reply = await this.messageIntentService.processMessage(message, {
      householdId: household.id,
      telegramUserId,
      displayName,
      personId: person.id,
    });

    return { reply };
  }
}
