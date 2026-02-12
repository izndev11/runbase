"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
console.log("ðŸ”¥ SERVER REAL SENDO EXECUTADO ðŸ”¥");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const usuarios_routes_1 = __importDefault(require("./routes/usuarios.routes"));
const eventos_routes_1 = __importDefault(require("./routes/eventos.routes"));
const categorias_routes_1 = __importDefault(require("./routes/categorias.routes"));
const inscricoes_routes_1 = __importDefault(require("./routes/inscricoes.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const pagamentos_routes_1 = __importDefault(require("./routes/pagamentos.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
app.use("/usuarios", usuarios_routes_1.default);
app.use("/eventos", eventos_routes_1.default);
app.use("/api/categorias", categorias_routes_1.default);
app.use("/api/inscricoes", inscricoes_routes_1.default);
app.use("/auth", auth_routes_1.default);
app.use("/pagamentos", pagamentos_routes_1.default);
app.use("/admin", admin_routes_1.default);
app.get("/", (req, res) => {
    res.send("API rodando ðŸš€");
});
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
