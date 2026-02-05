import { Router } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

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

    const usuario = await prisma.usuario.findFirst({
      where: { email: { equals: emailNormalizado, mode: "insensitive" } },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const senhaValida = await bcrypt.compare(senhaNormalizada, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { userId: usuario.id, role: usuario.role },
      process.env.JWT_SECRET || "segredo_dev",
      { expiresIn: "1d" }
    );

    return res.json({ token, role: usuario.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro no login" });
  }
});

export default router;
