import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;
    }
  }
}

export {};


declare namespace Express {
  export interface Request {
    userId?: number;
  }
}
