/*
  Warnings:

  - You are about to drop the column `dataNascimento` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `senha` on the `Usuario` table. All the data in the column will be lost.
  - Added the required column `data_nascimento` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome_completo` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senha_hash` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "dataNascimento",
DROP COLUMN "nome",
DROP COLUMN "senha",
ADD COLUMN     "data_nascimento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nome_completo" TEXT NOT NULL,
ADD COLUMN     "senha_hash" TEXT NOT NULL;
