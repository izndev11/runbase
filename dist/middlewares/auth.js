"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido" });
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
        return res.status(401).json({ error: "Token mal formatado" });
    }
    const [scheme, token] = parts;
    if (scheme !== "Bearer") {
        return res.status(401).json({ error: "Token mal formatado" });
    }
    try {
        const secret = process.env.JWT_SECRET || "segredo_dev";
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        if (typeof decoded === "object" && decoded && "userId" in decoded) {
            req.userId = Number(decoded.userId);
        }
        if (typeof decoded === "object" && decoded && "role" in decoded) {
            req.userRole = String(decoded.role);
        }
        return next();
    }
    catch {
        return res.status(401).json({ error: "Token inválido" });
    }
}
