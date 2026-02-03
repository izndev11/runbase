import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { apiError } from "../utils/apiError";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  const { eventoId } = req.body;
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({ error: "UsuÃ¡rio nÃ£o autenticado" });
  }

  if (!eventoId) {
    return res.status(400).json({ error: "eventoId Ã© obrigatÃ³rio" });
  }

  try {
    const inscricao = await prisma.inscricao.create({
      data: {
        usuarioId,
        eventoId: Number(eventoId),
      },
    });

    return res.status(201).json(inscricao);
  } catch (error) {
    return res
      .status(400)
      .json({ error: "UsuÃ¡rio jÃ¡ inscrito nesse evento" });
  }
});

router.get("/minhas", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.userId;

    if (!usuarioId) {
      return res.status(401).json({ error: "UsuÃ¡rio nÃ£o autenticado" });
    }

    const inscricoes = await prisma.inscricao.findMany({
      where: { usuarioId },
      include: { evento: true },
    });

    return res.json(inscricoes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar inscriÃ§Ãµes" });
  }
});

router.patch("/:id/pagar", authMiddleware, async (req, res) => {
  const usuarioId = req.userId;
  const id = Number(req.params.id);

  if (!usuarioId) {
    return res.status(401).json({ error: "UsuÃ¡rio nÃ£o autenticado" });
  }

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
  });

  if (!inscricao) {
    return apiError(res, 404, "InscriÃ§Ã£o nÃ£o encontrada");
  }

  if (inscricao.usuarioId !== usuarioId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  if (inscricao.status !== "PENDENTE") {
    return res
      .status(400)
      .json({ error: "InscriÃ§Ã£o nÃ£o estÃ¡ pendente" });
  }

  const inscricaoPaga = await prisma.inscricao.update({
    where: { id },
    data: { status: "PAGO" },
  });

  return res.json(inscricaoPaga);
});

router.patch("/:id/cancelar", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.userId;
    const id = Number(req.params.id);

    if (!usuarioId) {
      return res.status(401).json({ error: "UsuÃ¡rio nÃ£o autenticado" });
    }

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
    });

    if (!inscricao) {
      return apiError(res, 404, "InscriÃ§Ã£o nÃ£o encontrada");
    }

    if (inscricao.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    if (inscricao.status === "PAGO") {
      return res.status(400).json({
        error: "InscriÃ§Ã£o paga nÃ£o pode ser cancelada",
      });
    }

    if (inscricao.status === "CANCELADO") {
      return res.status(400).json({
        error: "InscriÃ§Ã£o jÃ¡ estÃ¡ cancelada",
      });
    }

    const inscricaoCancelada = await prisma.inscricao.update({
      where: { id },
      data: { status: "CANCELADO" },
    });

    return res.json({
      message: "InscriÃ§Ã£o cancelada com sucesso",
      inscricao: inscricaoCancelada,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao cancelar inscriÃ§Ã£o" });
  }
});

export default router;
