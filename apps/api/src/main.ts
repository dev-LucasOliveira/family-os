import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from './common/database-exception.filter';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DatabaseExceptionFilter());
  await app.listen(env.PORT);
  console.log(`Family OS API listening on port ${env.PORT}`);
}

bootstrap();
