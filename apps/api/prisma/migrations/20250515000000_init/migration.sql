-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "telegram_id" TEXT NOT NULL,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "person_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "list_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "list_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "people_telegram_id_key" ON "people"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "lists_name_key" ON "lists"("name");

-- CreateIndex
CREATE UNIQUE INDEX "list_items_list_id_name_key" ON "list_items"("list_id", "name");

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
