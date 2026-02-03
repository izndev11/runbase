import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
    const decoded = jwt.verify(token, secret);

    req.user = decoded;
    if (typeof decoded === "object" && decoded && "userId" in decoded) {
      req.userId = Number((decoded as any).userId);
    }
    if (typeof decoded === "object" && decoded && "role" in decoded) {
      req.userRole = String((decoded as any).role);
    }

    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

