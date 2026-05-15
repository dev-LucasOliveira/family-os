# Family OS

Assistente familiar via Telegram, com foco em listas compartilhadas da casa. Interface e comandos em **pt-BR**.

## Stack

- **Monorepo:** pnpm workspaces
- **API:** NestJS + TypeScript (`apps/api`)
- **Shared:** `@family-os/shared` — tipos, schemas Zod, mensagens pt-BR
- **Banco:** PostgreSQL + Prisma
- **Validação:** Zod

## Pré-requisitos

- Node.js 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) (PostgreSQL local)

## Setup local

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
pnpm db:push
pnpm dev
```

A API sobe em `http://localhost:3000`.

### Testar sem Telegram

**Health check:**

```bash
curl http://localhost:3000/health
```

**Adicionar item:**

```bash
curl -X POST http://localhost:3000/intents/test \
  -H "Content-Type: application/json" \
  -d '{"message":"adiciona banana na mercearia","telegramChatId":"local-test"}'
```

Resposta esperada:

```json
{ "reply": "Adicionei banana na lista mercearia." }
```

**Ver a lista:**

```bash
curl -X POST http://localhost:3000/intents/test \
  -H "Content-Type: application/json" \
  -d '{"message":"mostra lista mercearia","telegramChatId":"local-test"}'
```

A resposta deve conter `banana`.

Configure `TELEGRAM_BOT_TOKEN` em `apps/api/.env` antes de usar o webhook do Telegram.

## Comandos suportados (MVP)

| Mensagem | Ação |
|----------|------|
| `adiciona banana na mercearia` | Adicionar item |
| `mostra lista compras` | Ver lista |
| `marca banana na mercearia` | Marcar como feito |
| `remove banana da mercearia` | Remover item |

Variações aceitas: `adicionar`, `coloca`, `mostrar`, `ver`, `marcar`, `conferir`, `remover`, `tira`, com `na`/`no`/`em`/`da`/`de` e `lista` opcional.

## Webhook Telegram

Com ngrok ou similar:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<seu-host>/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

## Fluxo de exemplo

```
adiciona banana na mercearia
```

1. `POST /telegram/webhook` recebe a mensagem
2. Parser determinístico (pt-BR) → `add_item`
3. Item salvo no PostgreSQL
4. Resposta: `Adicionei banana na lista mercearia.`

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | API em modo watch |
| `pnpm build` | Build de todos os pacotes |
| `pnpm db:push` | Sincronizar schema |
| `pnpm db:migrate` | Migrations |
| `pnpm db:studio` | Prisma Studio |

## Estrutura

```
family-os/
  apps/api/
  packages/shared/     # i18n pt-BR, intents, Telegram schemas
  docker-compose.yml
```

## LLM (Groq)

Por padrão o parser é determinístico (regex, sem chamadas externas). Para usar Groq:

### Habilitar Groq

Em `apps/api/.env`:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...          # chave em https://console.groq.com/keys
GROQ_MODEL=llama-3.1-8b-instant  # opcional, este é o padrão
```

### Voltar ao modo determinístico

```env
LLM_PROVIDER=deterministic
```

### O que muda com Groq

- Frases mais naturais são entendidas sem regex (ex: "preciso de leite e ovos pra semana")
- Fallback automático para o parser determinístico se Groq falhar, demorar mais de 5s ou retornar JSON inválido
- Logs indicam qual provider foi usado e se houve fallback

### Exemplos com `/intents/test`

Os endpoints são idênticos independente do provider:

```bash
# Adicionar item
curl -X POST http://localhost:3000/intents/test \
  -H "Content-Type: application/json" \
  -d '{"message":"adiciona leite em pó na lista de mercado","telegramChatId":"local-test"}'

# Ver lista
curl -X POST http://localhost:3000/intents/test \
  -H "Content-Type: application/json" \
  -d '{"message":"o que temos na lista de mercado?","telegramChatId":"local-test"}'

# Mensagem fora do domínio (retorna fallback amigável)
curl -X POST http://localhost:3000/intents/test \
  -H "Content-Type: application/json" \
  -d '{"message":"tenho consulta amanhã?","telegramChatId":"local-test"}'
```

## Licença

Projeto privado — uso familiar.
