/*
  Warnings:

  - You are about to drop the column `preco` on the `Categoria` table. All the data in the column will be lost.
  - You are about to drop the column `vagasDisponiveis` on the `Categoria` table. All the data in the column will be lost.
  - You are about to drop the column `vagasTotais` on the `Categoria` table. All the data in the column will be lost.
  - The primary key for the `Inscricao` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoriaId` on the `Inscricao` table. All the data in the column will be lost.
  - You are about to drop the column `criadoEm` on the `Inscricao` table. All the data in the column will be lost.
  - You are about to drop the column `tamanhoCamiseta` on the `Inscricao` table. All the data in the column will be lost.
  - You are about to drop the column `valorPago` on the `Inscricao` table. All the data in the column will be lost.
  - The `id` column on the `Inscricao` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[usuarioId,eventoId]` on the table `Inscricao` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Inscricao" DROP CONSTRAINT "Inscricao_categoriaId_fkey";

-- AlterTable
ALTER TABLE "Categoria" DROP COLUMN "preco",
DROP COLUMN "vagasDisponiveis",
DROP COLUMN "vagasTotais";

-- AlterTable
ALTER TABLE "Inscricao" DROP CONSTRAINT "Inscricao_pkey",
DROP COLUMN "categoriaId",
DROP COLUMN "criadoEm",
DROP COLUMN "tamanhoCamiseta",
DROP COLUMN "valorPago",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Inscricao_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Inscricao_usuarioId_eventoId_key" ON "Inscricao"("usuarioId", "eventoId");
