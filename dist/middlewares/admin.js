"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = adminMiddleware;
function adminMiddleware(req, res, next) {
    if (req.userRole === "ADMIN") {
        return next();
    }
    return res.status(403).json({ error: "Acesso apenas para administradores" });
}
