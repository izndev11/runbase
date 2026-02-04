import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { sendPagamentoEmail } from "../utils/email";

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
    include: {
      inscricao: {
        include: { usuario: true, evento: true },
      },
    },
  });

  await prisma.inscricao.update({
    where: { id: pagamento.inscricaoId },
    data: { status: "PAGO" },
  });

  try {
    const usuario = pagamento.inscricao?.usuario;
    const evento = pagamento.inscricao?.evento;
    if (usuario?.email) {
      await sendPagamentoEmail({
        to: usuario.email,
        nome: usuario.nome_completo || "Participante",
        eventoTitulo: evento?.titulo || "Evento",
        valor: pagamento.valor,
        inscricaoId: pagamento.inscricaoId,
      });
    }
  } catch (error) {
    console.error("Erro ao enviar e-mail de pagamento:", error);
  }

  return res.json({ message: "Pagamento confirmado" });
});

export default router;
