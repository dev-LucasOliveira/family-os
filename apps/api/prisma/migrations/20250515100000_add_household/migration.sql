-- Migration: Add Household model, scope lists by household, add lastSeenAt to Person

-- 1. Criar tabela households
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "telegram_chat_id" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "households_telegram_chat_id_key" ON "households"("telegram_chat_id");

-- 2. Adicionar last_seen_at a people
ALTER TABLE "people" ADD COLUMN "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. Adicionar household_id em lists (nullable temporariamente)
ALTER TABLE "lists" ADD COLUMN "household_id" TEXT;

-- 4. Criar household legado para dados existentes
INSERT INTO "households" ("id", "telegram_chat_id", "name", "updated_at")
VALUES ('cllegacyhousehold00000', 'legacy', 'Legado', CURRENT_TIMESTAMP);

-- 5. Apontar todas as lists existentes para o household legado
UPDATE "lists" SET "household_id" = 'cllegacyhousehold00000';

-- 6. Tornar household_id NOT NULL
ALTER TABLE "lists" ALTER COLUMN "household_id" SET NOT NULL;

-- 7. Adicionar FK de lists para households
ALTER TABLE "lists" ADD CONSTRAINT "lists_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Remover unique global em name (criado como índice pelo Prisma, não como constraint)
DROP INDEX IF EXISTS "lists_name_key";

-- 9. Adicionar unique composto [household_id, name]
ALTER TABLE "lists" ADD CONSTRAINT "lists_household_id_name_key" UNIQUE ("household_id", "name");

-- 10. Remover person_id de lists
ALTER TABLE "lists" DROP CONSTRAINT IF EXISTS "lists_person_id_fkey";
ALTER TABLE "lists" DROP COLUMN IF EXISTS "person_id";
