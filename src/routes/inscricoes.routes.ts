import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      usuarioId,
      eventoId,
      categoriaId,
      tamanhoCamiseta
    } = req.body;

    if (!usuarioId || !eventoId || !categoriaId) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId }
    });

    if (!categoria || categoria.vagasDisponiveis <= 0) {
      return res.status(400).json({ error: "Categoria sem vagas disponíveis" });
    }

    const inscricao = await prisma.$transaction(async (tx) => {
      await tx.categoria.update({
        where: { id: categoriaId },
        data: {
          vagasDisponiveis: {
            decrement: 1
          }
        }
      });

      return tx.inscricao.create({
        data: {
          usuarioId,
          eventoId,
          categoriaId,
          tamanhoCamiseta,
          valorPago: categoria.preco,
          status: "PENDENTE"
        }
      });
    });

    return res.status(201).json(inscricao);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar inscrição" });
  }
});

export default router;
