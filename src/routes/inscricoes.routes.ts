import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      usuarioId,
      eventoId,
      categoriaId,
      tamanhoCamiseta
    } = req.body;

    if (!usuarioId || !eventoId || !categoriaId) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId }
    });

    if (!categoria || categoria.vagasDisponiveis <= 0) {
      return res.status(400).json({ error: "Categoria sem vagas disponíveis" });
    }

    const inscricao = await prisma.$transaction(async (tx) => {
      await tx.categoria.update({
        where: { id: categoriaId },
        data: {
          vagasDisponiveis: {
            decrement: 1
          }
        }
      });

      return tx.inscricao.create({
        data: {
          usuarioId,
          eventoId,
          categoriaId,
          tamanhoCamiseta,
          valorPago: categoria.preco,
          status: "PENDENTE"
        }
      });
    });

    return res.status(201).json(inscricao);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar inscrição" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const { eventoId, categoriaId, tamanhoCamiseta } = req.body;

    if (!eventoId || !categoriaId) {
      return res.status(400).json({
        error: "eventoId e categoriaId são obrigatórios",
      });
    }

    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId },
    });

    if (!categoria) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    if (categoria.vagasDisponiveis <= 0) {
      return res.status(400).json({ error: "Categoria sem vagas disponíveis" });
    }

    const inscricao = await prisma.inscricao.create({
      data: {
        usuarioId: userId,
        eventoId,
        categoriaId,
        tamanhoCamiseta,
        valorPago: categoria.preco,
      },
    });

    await prisma.categoria.update({
      where: { id: categoriaId },
      data: {
        vagasDisponiveis: categoria.vagasDisponiveis - 1,
      },
    });

    return res.status(201).json(inscricao);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar inscrição" });
  }
});

router.get("/minhas", authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).userId;

    const inscricoes = await prisma.inscricao.findMany({
      where: {
        usuarioId: userId,
      },
      include: {
        evento: {
          select: {
            id: true,
            titulo: true,
            dataEvento: true,
            local: true,
          },
        },
        categoria: {
          select: {
            id: true,
            nome: true,
            preco: true,
          },
        },
      },
    });

    return res.json(inscricoes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao listar inscrições" });
  }
});

//ROTA PAGAR INSCRIÇÃO//
router.patch("/:id/pagar", authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const id = req.params.id as string;

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
    });

    if (!inscricao) {
      return res.status(404).json({ error: "Inscrição não encontrada" });
    }

    if (inscricao.usuarioId !== userId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    if (inscricao.status !== "PENDENTE") {
      return res.status(400).json({
        error: "Inscrição não pode ser paga",
        statusAtual: inscricao.status,
      });
    }

    const inscricaoPaga = await prisma.inscricao.update({
      where: { id },
      data: {
        status: "PAGO",
      },
    });

    return res.json({
      message: "Pagamento realizado com sucesso",
      inscricao: inscricaoPaga,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao processar pagamento" });
  }
});

//ROTA CANCELAR INSCRIÇÃO//
router.patch("/:id/cancelar", authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const id = req.params.id as string;

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      include: { categoria: true },
    });

    if (!inscricao) {
      return res.status(404).json({ error: "Inscrição não encontrada" });
    }

    if (inscricao.usuarioId !== userId) {
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

    await prisma.categoria.update({
      where: { id: inscricao.categoriaId },
      data: {
        vagasDisponiveis: {
          increment: 1,
        },
      },
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
