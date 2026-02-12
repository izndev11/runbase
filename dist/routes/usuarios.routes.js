"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middlewares/auth");
const apiError_1 = require("../utils/apiError");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
router.get("/", (req, res) => res.json([]));
router.post("/", async (req, res) => {
    try {
        const { nome_completo, email, cpf, senha, data_nascimento, telefone, sexo, cidade, estado } = req.body;
        const emailNormalizado = String(email || "").trim().toLowerCase();
        const senhaNormalizada = String(senha || "").trim();
        const cpfNormalizado = String(cpf || "").trim();
        const nomeNormalizado = String(nome_completo || "").trim();
        const telefoneNormalizado = String(telefone || "").trim();
        const sexoNormalizado = String(sexo || "").trim();
        const cidadeNormalizada = String(cidade || "").trim();
        const estadoNormalizado = String(estado || "").trim();
        if (!nomeNormalizado ||
            !emailNormalizado ||
            !cpfNormalizado ||
            !senhaNormalizada ||
            !data_nascimento ||
            !telefoneNormalizado ||
            !sexoNormalizado ||
            !cidadeNormalizada ||
            !estadoNormalizado) {
            return res.status(400).json({ error: "Dados obrigatórios faltando" });
        }
        const usuarioExistente = await prisma_1.prisma.usuario.findFirst({
            where: {
                OR: [{ email: emailNormalizado }, { cpf: cpfNormalizado }],
            },
        });
        if (usuarioExistente) {
            return res.status(400).json({ error: "Usuário já existe" });
        }
        const senha_hash = await bcryptjs_1.default.hash(senhaNormalizada, 10);
        const usuario = await prisma_1.prisma.usuario.create({
            data: {
                nome_completo: nomeNormalizado,
                email: emailNormalizado,
                cpf: cpfNormalizado,
                senha_hash,
                data_nascimento: new Date(data_nascimento),
                telefone: telefoneNormalizado,
                sexo: sexoNormalizado,
                cidade: cidadeNormalizada,
                estado: estadoNormalizado,
            },
        });
        // Envia e-mail de boas-vindas (não bloqueia o cadastro)
        (0, email_1.sendBoasVindasEmail)({
            to: usuario.email,
            nome: usuario.nome_completo,
        }).catch((err) => {
            console.error("Erro ao enviar e-mail de boas-vindas:", err);
        });
        return res.status(201).json(usuario);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro ao criar usuário" });
    }
});
router.get("/:id/inscricoes", auth_1.authMiddleware, async (req, res) => {
    const usuarioId = Number(req.params.id);
    if (!req.userId || req.userId !== usuarioId) {
        return res.status(403).json({ error: "Acesso negado" });
    }
    const inscricoes = await prisma_1.prisma.inscricao.findMany({
        where: { usuarioId },
        include: { evento: true },
    });
    return res.json(inscricoes);
});
router.get("/me", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        const usuario = await prisma_1.prisma.usuario.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nome_completo: true,
                email: true,
                cpf: true,
                data_nascimento: true,
                sexo: true,
                telefone: true,
                cidade: true,
                estado: true,
                role: true,
                criadoEm: true,
            },
        });
        if (!usuario) {
            return (0, apiError_1.apiError)(res, 404, "Usuário não encontrado");
        }
        return res.json(usuario);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao buscar usuário" });
    }
});
exports.default = router;
