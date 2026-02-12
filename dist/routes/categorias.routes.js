"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post("/", auth_1.authMiddleware, async (req, res) => {
    const { nome, eventoId } = req.body;
    if (!nome || !eventoId) {
        return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }
    const categoria = await prisma_1.prisma.categoria.create({
        data: {
            nome,
            eventoId: Number(eventoId),
        },
    });
    res.status(201).json(categoria);
});
exports.default = router;
