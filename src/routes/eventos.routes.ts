import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { titulo, dataEvento, local, descricao, imagem_url, organizador, categorias } = req.body;

    if (!titulo || !dataEvento || !local) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const categoriasNorm = Array.isArray(categorias)
      ? categorias.map((item) => String(item).trim()).filter(Boolean)
      : typeof categorias === "string"
      ? categorias.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const evento = await prisma.evento.create({
      data: {
        titulo,
        dataEvento: new Date(dataEvento),
        local,
        descricao: descricao || null,
        imagem_url: imagem_url || null,
        organizador: organizador || null,
        categorias: categoriasNorm.length
          ? { create: categoriasNorm.map((nome) => ({ nome })) }
          : undefined,
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
