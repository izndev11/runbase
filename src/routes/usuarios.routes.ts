import { Router } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middlewares/auth";
import { apiError } from "../utils/apiError";

const router = Router();

router.get("/", (req, res) => res.json([]));

router.post("/", async (req, res) => {
  try {
    const { nome_completo, email, cpf, senha, data_nascimento, sexo } = req.body;
    const emailNormalizado = String(email || "").trim().toLowerCase();
    const senhaNormalizada = String(senha || "").trim();
    const cpfNormalizado = String(cpf || "").trim();
    const nomeNormalizado = String(nome_completo || "").trim();

    if (!nomeNormalizado || !emailNormalizado || !cpfNormalizado || !senhaNormalizada || !data_nascimento) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [{ email: emailNormalizado }, { cpf: cpfNormalizado }],
      },
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "Usuário já existe" });
    }

    const senha_hash = await bcrypt.hash(senhaNormalizada, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome_completo: nomeNormalizado,
        email: emailNormalizado,
        cpf: cpfNormalizado,
        senha_hash,
        data_nascimento: new Date(data_nascimento),
        sexo: sexo ? String(sexo) : null,
      },
    });

    return res.status(201).json(usuario);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar usuário" });
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
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome_completo: true,
        email: true,
        cpf: true,
        data_nascimento: true,
        sexo: true,
        role: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      return apiError(res, 404, "Usuário não encontrado");
    }

    return res.json(usuario);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

export default router;
