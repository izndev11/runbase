import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
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

  res.status(201).json(evento);
});

router.get("/", async (req, res) => {
  const eventos = await prisma.evento.findMany({
    include: {
      categorias: true
    }
  });

  res.json(eventos);
});

router.post("/", authMiddleware, async (req, res) => {
  return res.json({ message: "Rota protegida!" });
}); 

router.get("/", authMiddleware, async (req, res) => {
  return res.json({
    message: "Você está autenticado!",
    user: req.user
  });
});

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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar evento" });
  }
});

router.get("/", async (req, res) => {
  try {
    const eventos = await prisma.evento.findMany({
      include: {
        categorias: true,
      },
    });

    return res.json(eventos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar eventos" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { categoria } = req.query;

    const eventos = await prisma.evento.findMany({
      where: categoria
        ? {
            categorias: {
              some: {
                nome: String(categoria),
              },
            },
          }
        : undefined,
      include: {
        categorias: true,
      },
    });

    return res.json(eventos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar eventos" });
  }
});

export default router;
