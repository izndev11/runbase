"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const usuarios_routes_1 = __importDefault(require("./usuarios.routes"));
const categorias_routes_1 = __importDefault(require("./categorias.routes"));
const eventos_routes_1 = __importDefault(require("./eventos.routes"));
const inscricoes_routes_1 = __importDefault(require("./inscricoes.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/users", usuarios_routes_1.default);
router.use("/categories", categorias_routes_1.default);
router.use("/events", eventos_routes_1.default);
router.use("/subscriptions", inscricoes_routes_1.default);
exports.default = router;
