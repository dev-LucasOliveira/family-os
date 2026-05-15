import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOCALE: z.enum(['pt-BR']).default('pt-BR'),
  DATABASE_URL: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.1-8b-instant'),
  GROQ_TIMEOUT_MS: z.coerce.number().default(5000),
  LLM_PROVIDER: z.enum(['deterministic', 'groq']).default('deterministic'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const data = parsed.data;
  if (data.LLM_PROVIDER === 'groq' && !data.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY é obrigatório quando LLM_PROVIDER=groq');
  }

  return data;
}

export const env = loadEnv();
