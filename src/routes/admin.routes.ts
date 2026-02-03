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
    include: {
      _count: {
        select: { inscricoes: true },
      },
    },
  });
  return res.json(eventos);
});

router.put("/eventos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { titulo, dataEvento, local } = req.body;

    if (!titulo || !dataEvento || !local) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const evento = await prisma.evento.update({
      where: { id },
      data: {
        titulo,
        dataEvento: new Date(dataEvento),
        local,
      },
    });

    return res.json(evento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar evento" });
  }
});

router.delete("/eventos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.evento.delete({ where: { id } });
    return res.json({ message: "Evento removido" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao remover evento" });
  }
});

router.get("/eventos/:id/inscricoes", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const inscricoes = await prisma.inscricao.findMany({
      where: { eventoId: id },
      include: {
        usuario: { select: { id: true, nome_completo: true, email: true } },
      },
      orderBy: { id: "desc" },
    });
    return res.json(inscricoes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar inscrições" });
  }
});

export default router;
