import { Request, Response, NextFunction } from "express";

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.userRole === "ADMIN") {
    return next();
  }

  return res.status(403).json({ error: "Acesso apenas para administradores" });
}
