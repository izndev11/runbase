-- Add columns to Evento if missing (idempotent)
ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "descricao" TEXT;
ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "imagem_url" TEXT;
ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "organizador" TEXT;
ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "banner_url" TEXT;
