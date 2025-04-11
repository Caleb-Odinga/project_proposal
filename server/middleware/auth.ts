import { Request, Response, NextFunction } from "express";
import { Session } from "express-session";

declare module "express-session" {
  interface Session {
    user?: {
      id: number;
      username: string;
      email: string;
    };
  }
}

declare module "express" {
  interface Request {
    user?: {
      id: number;
      username: string;
      email: string;
    };
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  req.user = req.session.user;
  next();
};
