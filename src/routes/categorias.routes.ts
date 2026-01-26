import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  const { nome, preco, vagasTotais, eventoId } = req.body;

  if (!nome || !preco || !vagasTotais || !eventoId) {
    return res.status(400).json({ error: "Dados obrigatórios faltando" });
  }

  const categoria = await prisma.categoria.create({
    data: {
      nome,
      preco,
      vagasTotais,
      vagasDisponiveis: vagasTotais,
      eventoId,
    },
  });

  res.status(201).json(categoria);
});

export default router;
