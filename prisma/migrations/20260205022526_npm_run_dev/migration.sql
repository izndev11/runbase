-- CreateEnum
CREATE TYPE "TipoOpcao" AS ENUM ('CORRIDA', 'CAMINHADA');

-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "opcaoId" INTEGER,
ADD COLUMN     "taxa_percentual" DOUBLE PRECISION,
ADD COLUMN     "valor_base" DOUBLE PRECISION,
ADD COLUMN     "valor_taxa" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "EventoOpcao" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoOpcao" NOT NULL,
    "distancia_km" DOUBLE PRECISION NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "taxa_percentual" DOUBLE PRECISION NOT NULL,
    "eventoId" INTEGER NOT NULL,

    CONSTRAINT "EventoOpcao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_opcaoId_fkey" FOREIGN KEY ("opcaoId") REFERENCES "EventoOpcao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoOpcao" ADD CONSTRAINT "EventoOpcao_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
