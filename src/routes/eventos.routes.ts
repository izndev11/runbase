import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { titulo, dataEvento, local, descricao, imagem_url, banner_url, organizador, categorias, meta } = req.body;

    if (!titulo || !dataEvento || !local) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const categoriasNorm = Array.isArray(categorias)
      ? categorias.map((item) => String(item).trim()).filter(Boolean)
      : typeof categorias === "string"
      ? categorias.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const montarDescricaoComMeta = (texto: unknown, metaObj: unknown): string | null => {
      const base = typeof texto === "string" ? texto : "";
      const marker = "\n\n[[META]]\n";
      if (base.includes(marker)) return base;
      if (!metaObj) return base || null;
      try {
        const metaJson = JSON.stringify(metaObj);
        const visivel = base ? base.trim() : "";
        return `${visivel}${marker}${metaJson}`;
      } catch (err) {
        return base || null;
      }
    };

    const evento = await prisma.evento.create({
      data: {
        titulo,
        dataEvento: new Date(dataEvento),
        local,
        descricao: montarDescricaoComMeta(descricao, meta),
        meta: meta || null,
        imagem_url: imagem_url || null,
        banner_url: banner_url || null,
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
        opcoes: true,
      },
    });

    return res.json(eventos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar eventos" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const evento = await prisma.evento.findUnique({
      where: { id },
      include: {
        categorias: true,
        opcoes: true,
      },
    });
    if (!evento) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }
    return res.json(evento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar evento" });
  }
});

export default router;
