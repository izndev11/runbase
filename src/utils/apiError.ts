import { Response } from "express";

export function apiError(
  res: Response,
  status: number,
  message: string
) {
  return res.status(status).json({ error: message });
}
