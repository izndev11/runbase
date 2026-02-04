import { Router } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middlewares/auth";
import { apiError } from "../utils/apiError";

const router = Router();

router.get("/", (req, res) => res.json([]));

router.post("/", async (req, res) => {
  try {
    const { nome_completo, email, cpf, senha, data_nascimento } = req.body;

    if (!nome_completo || !email || !cpf || !senha || !data_nascimento) {
      return res.status(400).json({ error: "Dados obrigatÃ³rios faltando" });
    }

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { cpf }],
      },
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "UsuÃ¡rio jÃ¡ existe" });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome_completo,
        email,
        cpf,
        senha_hash,
        data_nascimento: new Date(data_nascimento),
      },
    });

    return res.status(201).json(usuario);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar usuÃ¡rio" });
  }
});

router.get("/:id/inscricoes", authMiddleware, async (req, res) => {
  const usuarioId = Number(req.params.id);

  if (!req.userId || req.userId !== usuarioId) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const inscricoes = await prisma.inscricao.findMany({
    where: { usuarioId },
    include: { evento: true },
  });

  return res.json(inscricoes);
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "UsuÃ¡rio nÃ£o autenticado" });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome_completo: true,
        email: true,
        cpf: true,
        role: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      return apiError(res, 404, "UsuÃ¡rio nÃ£o encontrado");
    }

    return res.json(usuario);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar usuÃ¡rio" });
  }
});

export default router;
