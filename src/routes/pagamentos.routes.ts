import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  const { inscricaoId, metodo, valor } = req.body;
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  if (!inscricaoId || !metodo || valor === undefined) {
    return res.status(400).json({ error: "Dados obrigatórios" });
  }

  const inscricao = await prisma.inscricao.findFirst({
    where: {
      id: Number(inscricaoId),
      usuarioId,
    },
  });

  if (!inscricao) {
    return res.status(404).json({ error: "Inscrição não encontrada" });
  }

  const pagamento = await prisma.pagamento.create({
    data: {
      valor: Number(valor),
      metodo,
      inscricaoId: Number(inscricaoId),
    },
  });

  return res.json(pagamento);
});

router.patch("/:id/confirmar", authMiddleware, async (req, res) => {
  const { id } = req.params;

  const pagamento = await prisma.pagamento.update({
    where: { id: Number(id) },
    data: { status: "PAGO" },
    include: { inscricao: true },
  });

  await prisma.inscricao.update({
    where: { id: pagamento.inscricaoId },
    data: { status: "PAGO" },
  });

  return res.json({ message: "Pagamento confirmado" });
});

export default router;
