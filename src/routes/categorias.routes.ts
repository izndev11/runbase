import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      nome,
      preco,
      vagasTotais,
      eventoId
    } = req.body;

    if (!nome || !preco || !vagasTotais || !eventoId) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const categoria = await prisma.categoria.create({
      data: {
        nome,
        preco,
        vagasTotais,
        vagasDisponiveis: vagasTotais,
        eventoId
      }
    });

    return res.status(201).json(categoria);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar categoria" });
  }
});

export default router;
