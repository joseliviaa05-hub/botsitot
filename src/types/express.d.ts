// src/types/express.d.ts
import { Rol } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        rol: Rol;
      };
    }
  }
}

export {};