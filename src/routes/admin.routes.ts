import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/admin";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.post("/eventos", async (req, res) => {
  try {
    const { titulo, dataEvento, local } = req.body;

    if (!titulo || !dataEvento || !local) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const evento = await prisma.evento.create({
      data: {
        titulo,
        dataEvento: new Date(dataEvento),
        local,
      },
    });

    return res.status(201).json(evento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar evento" });
  }
});

router.get("/eventos", async (_req, res) => {
  const eventos = await prisma.evento.findMany({
    orderBy: { dataEvento: "asc" },
  });
  return res.json(eventos);
});

export default router;
