"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
router.post("/login", async (req, res) => {
    console.log("LOGIN CHEGOU NO BACKEND");
    console.log("BODY:", req.body);
    try {
        const { email, senha } = req.body;
        const emailNormalizado = String(email || "").trim().toLowerCase();
        const senhaNormalizada = String(senha || "").trim();
        if (!emailNormalizado || !senhaNormalizada) {
            return res.status(400).json({ error: "Email e senha obrigatórios" });
        }
        const usuario = await prisma_1.prisma.usuario.findFirst({
            where: { email: { equals: emailNormalizado, mode: "insensitive" } },
        });
        if (!usuario) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }
        const senhaValida = await bcryptjs_1.default.compare(senhaNormalizada, usuario.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: usuario.id, role: usuario.role }, process.env.JWT_SECRET || "segredo_dev", { expiresIn: "1d" });
        return res.json({ token, role: usuario.role });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro no login" });
    }
});
exports.default = router;
