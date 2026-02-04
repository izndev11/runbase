import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { apiError } from "../utils/apiError";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  const { eventoId } = req.body;
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  if (!eventoId) {
    return res.status(400).json({ error: "eventoId é obrigatório" });
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
      .json({ error: "Usuário já inscrito nesse evento" });
  }
});

router.get("/minhas", authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.userId;

    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const inscricoes = await prisma.inscricao.findMany({
      where: { usuarioId },
      include: { evento: true },
    });

    return res.json(inscricoes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar inscrições" });
  }
});

router.patch("/:id/pagar", authMiddleware, async (req, res) => {
  const usuarioId = req.userId;
  const id = Number(req.params.id);

  if (!usuarioId) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  const inscricao = await prisma.inscricao.findUnique({
    where: { id },
  });

  if (!inscricao) {
    return apiError(res, 404, "Inscrição não encontrada");
  }

  if (inscricao.usuarioId !== usuarioId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  if (inscricao.status !== "PENDENTE") {
    return res
      .status(400)
      .json({ error: "Inscrição não está pendente" });
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
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
    });

    if (!inscricao) {
      return apiError(res, 404, "Inscrição não encontrada");
    }

    if (inscricao.usuarioId !== usuarioId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    if (inscricao.status === "PAGO") {
      return res.status(400).json({
        error: "Inscrição paga não pode ser cancelada",
      });
    }

    if (inscricao.status === "CANCELADO") {
      return res.status(400).json({
        error: "Inscrição já está cancelada",
      });
    }

    const inscricaoCancelada = await prisma.inscricao.update({
      where: { id },
      data: { status: "CANCELADO" },
    });

    return res.json({
      message: "Inscrição cancelada com sucesso",
      inscricao: inscricaoCancelada,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao cancelar inscrição" });
  }
});

export default router;
