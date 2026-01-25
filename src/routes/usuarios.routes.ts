import { Router } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      nome_completo,
      email,
      cpf,
      senha,
      data_nascimento
    } = req.body;

    if (!nome_completo || !email || !cpf || !senha || !data_nascimento) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { cpf }]
      }
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "Usuário já existe" });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome_completo,
        email,
        cpf,
        senha_hash,
        data_nascimento: new Date(data_nascimento)
      }
    });

    return res.status(201).json(usuario);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

router.get("/:id/inscricoes", async (req, res) => {
  try {
    const usuarioId = Number(req.params.id);

    const inscricoes = await prisma.inscricao.findMany({
      where: {
        usuarioId
      },
      include: {
        evento: true,
        categoria: true
      }
    });

    return res.json(inscricoes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar inscrições" });
  }
});

router.get("/:id/inscricoes", authMiddleware, async (req, res) => {
  const usuarioId = Number(req.params.id);

  if (req.userId !== usuarioId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const inscricoes = await prisma.inscricao.findMany({
    where: { usuarioId },
    include: { evento: true, categoria: true }
  });

  res.json(inscricoes);
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = (req.user as any).userId;

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome_completo: true,
        email: true,
        cpf: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.json(usuario);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

export default router;
