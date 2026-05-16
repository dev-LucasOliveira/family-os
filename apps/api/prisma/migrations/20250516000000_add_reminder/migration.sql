-- Migration: Add Reminder model

CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "created_by_person_id" TEXT,
    "text" TEXT NOT NULL,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reminders_remind_at_sent_at_idx" ON "reminders"("remind_at", "sent_at");

ALTER TABLE "reminders" ADD CONSTRAINT "reminders_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reminders" ADD CONSTRAINT "reminders_created_by_person_id_fkey"
    FOREIGN KEY ("created_by_person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
