"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middlewares/auth");
const apiError_1 = require("../utils/apiError");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
router.post("/", auth_1.authMiddleware, async (req, res) => {
    const { eventoId, opcaoId } = req.body;
    const usuarioId = req.userId;
    if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
    }
    if (!eventoId) {
        return res.status(400).json({ error: "eventoId é obrigatório" });
    }
    try {
        const inscricao = await prisma_1.prisma.inscricao.create({
            data: {
                usuarioId,
                eventoId: Number(eventoId),
            },
            include: {
                usuario: true,
                evento: true,
            },
        });
        try {
            if (inscricao.usuario?.email) {
                let opcao = null;
                if (opcaoId) {
                    opcao = await prisma_1.prisma.eventoOpcao.findUnique({
                        where: { id: Number(opcaoId) },
                    });
                }
                await (0, email_1.sendInscricaoEmail)({
                    to: inscricao.usuario.email,
                    nome: inscricao.usuario.nome_completo || "Participante",
                    eventoTitulo: inscricao.evento?.titulo || "Evento",
                    dataEvento: inscricao.evento?.dataEvento,
                    local: inscricao.evento?.local,
                    inscricaoId: inscricao.id,
                    opcaoTitulo: opcao?.titulo,
                    opcaoTipo: opcao?.tipo,
                    opcaoDistanciaKm: opcao?.distancia_km,
                });
            }
        }
        catch (error) {
            console.error("Erro ao enviar e-mail de inscrição:", error);
        }
        return res.status(201).json(inscricao);
    }
    catch (error) {
        return res
            .status(400)
            .json({ error: "Usuário já inscrito nesse evento" });
    }
});
router.get("/minhas", auth_1.authMiddleware, async (req, res) => {
    try {
        const usuarioId = req.userId;
        if (!usuarioId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        const inscricoes = await prisma_1.prisma.inscricao.findMany({
            where: { usuarioId },
            include: { evento: true },
        });
        return res.json(inscricoes);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao listar inscrições" });
    }
});
router.patch("/:id/pagar", auth_1.authMiddleware, async (req, res) => {
    const usuarioId = req.userId;
    const id = Number(req.params.id);
    if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
    }
    const inscricao = await prisma_1.prisma.inscricao.findUnique({
        where: { id },
    });
    if (!inscricao) {
        return (0, apiError_1.apiError)(res, 404, "Inscrição não encontrada");
    }
    if (inscricao.usuarioId !== usuarioId) {
        return res.status(403).json({ error: "Acesso negado" });
    }
    if (inscricao.status !== "PENDENTE") {
        return res
            .status(400)
            .json({ error: "Inscrição não está pendente" });
    }
    const inscricaoPaga = await prisma_1.prisma.inscricao.update({
        where: { id },
        data: { status: "PAGO" },
    });
    return res.json(inscricaoPaga);
});
router.patch("/:id/cancelar", auth_1.authMiddleware, async (req, res) => {
    try {
        const usuarioId = req.userId;
        const id = Number(req.params.id);
        if (!usuarioId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }
        const inscricao = await prisma_1.prisma.inscricao.findUnique({
            where: { id },
        });
        if (!inscricao) {
            return (0, apiError_1.apiError)(res, 404, "Inscrição não encontrada");
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
        const inscricaoCancelada = await prisma_1.prisma.inscricao.update({
            where: { id },
            data: { status: "CANCELADO" },
        });
        return res.json({
            message: "Inscrição cancelada com sucesso",
            inscricao: inscricaoCancelada,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao cancelar inscrição" });
    }
});
exports.default = router;
