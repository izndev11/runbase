"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, admin_1.adminMiddleware);
function normalizarCategorias(input) {
    if (Array.isArray(input)) {
        return input.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof input === "string") {
        return input
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}
function normalizarOpcoes(input) {
    if (!Array.isArray(input))
        return [];
    return input
        .map((item) => {
        const titulo = String(item?.titulo || "").trim();
        const tipo = String(item?.tipo || "").trim().toUpperCase();
        const distancia_km = Number(item?.distancia_km ?? item?.distanciaKm ?? 0);
        const preco = Number(item?.preco ?? 0);
        const taxa_percentual = Number(item?.taxa_percentual ?? item?.taxaPercentual ?? 0);
        if (!titulo || !tipo || !distancia_km || !preco)
            return null;
        return { titulo, tipo, distancia_km, preco, taxa_percentual };
    })
        .filter((opcao) => opcao !== null);
}
function montarDescricaoComMeta(descricao, meta) {
    const texto = typeof descricao === "string" ? descricao : "";
    const marker = "\n\n[[META]]\n";
    if (texto.includes(marker))
        return texto;
    if (!meta)
        return texto || null;
    try {
        const metaJson = JSON.stringify(meta);
        const visivel = texto ? texto.trim() : "";
        return `${visivel}${marker}${metaJson}`;
    }
    catch (err) {
        return texto || null;
    }
}
router.post("/eventos", async (req, res) => {
    try {
        const { titulo, dataEvento, local, descricao, imagem_url, banner_url, organizador, categorias, opcoes, pix_chave, pix_tipo, pix_beneficiario, } = req.body;
        const { meta } = req.body;
        if (!titulo || !dataEvento || !local) {
            return res.status(400).json({ error: "Dados obrigatórios faltando" });
        }
        const categoriasNorm = normalizarCategorias(categorias);
        const opcoesNorm = normalizarOpcoes(opcoes);
        const evento = await prisma_1.prisma.evento.create({
            data: {
                titulo,
                dataEvento: new Date(dataEvento),
                local,
                descricao: montarDescricaoComMeta(descricao, meta),
                meta: meta || null,
                imagem_url: imagem_url || null,
                banner_url: banner_url || null,
                organizador: organizador || null,
                pix_chave: pix_chave || null,
                pix_tipo: pix_tipo || null,
                pix_beneficiario: pix_beneficiario || null,
                categorias: categoriasNorm.length
                    ? { create: categoriasNorm.map((nome) => ({ nome })) }
                    : undefined,
                opcoes: opcoesNorm.length
                    ? {
                        create: opcoesNorm.map((opcao) => ({
                            titulo: opcao.titulo,
                            tipo: opcao.tipo,
                            distancia_km: opcao.distancia_km,
                            preco: opcao.preco,
                            taxa_percentual: opcao.taxa_percentual,
                        })),
                    }
                    : undefined,
            },
        });
        return res.status(201).json(evento);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao criar evento" });
    }
});
router.get("/eventos", async (_req, res) => {
    const eventos = await prisma_1.prisma.evento.findMany({
        orderBy: { dataEvento: "asc" },
        include: {
            categorias: true,
            opcoes: true,
            _count: {
                select: { inscricoes: true },
            },
        },
    });
    return res.json(eventos);
});
router.get("/eventos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ error: "ID inválido" });
        }
        const evento = await prisma_1.prisma.evento.findUnique({
            where: { id },
            include: {
                categorias: true,
                opcoes: true,
                _count: {
                    select: { inscricoes: true },
                },
            },
        });
        if (!evento) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }
        return res.json(evento);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao buscar evento" });
    }
});
router.put("/eventos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { titulo, dataEvento, local, descricao, imagem_url, banner_url, organizador, categorias, opcoes, pix_chave, pix_tipo, pix_beneficiario, } = req.body;
        const { meta } = req.body;
        if (!titulo || !dataEvento || !local) {
            return res.status(400).json({ error: "Dados obrigatórios faltando" });
        }
        const categoriasNorm = normalizarCategorias(categorias);
        const opcoesNorm = normalizarOpcoes(opcoes);
        const evento = await prisma_1.prisma.evento.update({
            where: { id },
            data: {
                titulo,
                dataEvento: new Date(dataEvento),
                local,
                descricao: montarDescricaoComMeta(descricao, meta),
                meta: meta || null,
                imagem_url: imagem_url || null,
                banner_url: banner_url || null,
                organizador: organizador || null,
                pix_chave: pix_chave || null,
                pix_tipo: pix_tipo || null,
                pix_beneficiario: pix_beneficiario || null,
                categorias: {
                    deleteMany: {},
                    create: categoriasNorm.map((nome) => ({ nome })),
                },
                opcoes: {
                    deleteMany: {},
                    create: opcoesNorm.map((opcao) => ({
                        titulo: opcao.titulo,
                        tipo: opcao.tipo,
                        distancia_km: opcao.distancia_km,
                        preco: opcao.preco,
                        taxa_percentual: opcao.taxa_percentual,
                    })),
                },
            },
        });
        return res.json(evento);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao atualizar evento" });
    }
});
router.delete("/eventos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.pagamento.deleteMany({
                where: {
                    inscricao: { eventoId: id },
                },
            }),
            prisma_1.prisma.inscricao.deleteMany({ where: { eventoId: id } }),
            prisma_1.prisma.categoria.deleteMany({ where: { eventoId: id } }),
            prisma_1.prisma.eventoOpcao.deleteMany({ where: { eventoId: id } }),
            prisma_1.prisma.evento.delete({ where: { id } }),
        ]);
        return res.json({ message: "Evento removido" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao remover evento" });
    }
});
router.get("/eventos/:id/inscricoes", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const inscricoes = await prisma_1.prisma.inscricao.findMany({
            where: { eventoId: id },
            include: {
                usuario: { select: { id: true, nome_completo: true, email: true } },
            },
            orderBy: { id: "desc" },
        });
        return res.json(inscricoes);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao buscar inscrições" });
    }
});
router.get("/eventos/:id/inscricoes.csv", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const inscricoes = await prisma_1.prisma.inscricao.findMany({
            where: { eventoId: id },
            include: {
                usuario: { select: { nome_completo: true, email: true } },
                evento: { select: { titulo: true } },
            },
            orderBy: { id: "asc" },
        });
        const header = ["nome_completo", "email", "status", "evento"].join(",");
        const rows = inscricoes.map((i) => {
            const nome = (i.usuario?.nome_completo || "").replace(/"/g, '""');
            const email = (i.usuario?.email || "").replace(/"/g, '""');
            const status = (i.status || "").replace(/"/g, '""');
            const evento = (i.evento?.titulo || "").replace(/"/g, '""');
            return `"${nome}","${email}","${status}","${evento}"`;
        });
        const csv = [header, ...rows].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="inscricoes_evento_${id}.csv"`);
        return res.send(csv);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao exportar CSV" });
    }
});
router.post("/inscricoes/:id/reenviar", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { tipo } = req.body;
        if (!tipo) {
            return res.status(400).json({ error: "Tipo de e-mail é obrigatório" });
        }
        const inscricao = await prisma_1.prisma.inscricao.findUnique({
            where: { id },
            include: {
                usuario: true,
                evento: true,
                pagamento: true,
            },
        });
        if (!inscricao) {
            return res.status(404).json({ error: "Inscrição não encontrada" });
        }
        if (!inscricao.usuario?.email) {
            return res.status(400).json({ error: "Usuário sem e-mail" });
        }
        if (tipo === "inscricao") {
            await (0, email_1.sendInscricaoEmail)({
                to: inscricao.usuario.email,
                nome: inscricao.usuario.nome_completo || "Participante",
                eventoTitulo: inscricao.evento?.titulo || "Evento",
                dataEvento: inscricao.evento?.dataEvento,
                local: inscricao.evento?.local,
                inscricaoId: inscricao.id,
            });
            return res.json({ message: "E-mail de inscrição reenviado" });
        }
        if (tipo === "pagamento") {
            if (!inscricao.pagamento) {
                return res.status(400).json({ error: "Pagamento não encontrado" });
            }
            await (0, email_1.sendPagamentoEmail)({
                to: inscricao.usuario.email,
                nome: inscricao.usuario.nome_completo || "Participante",
                eventoTitulo: inscricao.evento?.titulo || "Evento",
                valor: inscricao.pagamento.valor,
                inscricaoId: inscricao.id,
            });
            return res.json({ message: "E-mail de pagamento reenviado" });
        }
        return res.status(400).json({ error: "Tipo de e-mail inválido" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao reenviar e-mail" });
    }
});
exports.default = router;
