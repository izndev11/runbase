import "dotenv/config";
console.log("ðŸ”¥ SERVER REAL SENDO EXECUTADO ðŸ”¥");

import express from "express";
import cors from "cors";

import usuariosRoutes from "./routes/usuarios.routes";
import eventosRoutes from "./routes/eventos.routes";
import categoriasRoutes from "./routes/categorias.routes";
import inscricoesRoutes from "./routes/inscricoes.routes";
import authRoutes from "./routes/auth.routes";
import pagamentosRoutes from "./routes/pagamentos.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use("/usuarios", usuariosRoutes);
app.use("/eventos", eventosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/inscricoes", inscricoesRoutes);
app.use("/auth", authRoutes);
app.use("/pagamentos", pagamentosRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("API rodando ðŸš€");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
