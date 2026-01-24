import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma";
import usuariosRoutes from "./routes/usuarios.routes";
import eventosRoutes from "./routes/eventos.routes";
import categoriasRoutes from "./routes/categorias.routes";
import inscricoesRoutes from "./routes/inscricoes.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(express.json());
app.use("/usuarios", usuariosRoutes);
app.use("/eventos", eventosRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/inscricoes", inscricoesRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API rodando 🚀");
});

app.get("/usuarios", async (req, res) => {
  const usuarios = await prisma.usuario.findMany();
  res.json(usuarios);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});