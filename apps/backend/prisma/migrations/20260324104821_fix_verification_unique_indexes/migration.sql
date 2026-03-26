/*
  Warnings:

  - A unique constraint covering the columns `[identifier]` on the table `verifications` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "verifications_value_key";

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_key" ON "verifications"("identifier");
