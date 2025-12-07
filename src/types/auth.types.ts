// src/types/auth.types. ts
import { Rol } from '@prisma/client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  rol?: Rol;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  rol: Rol;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    nombre: string;
    rol: Rol;
  };
  token: string;
  expiresIn: string;
}

export interface TokenVerifyResult {
  valid: boolean;
  payload?: AuthTokenPayload;
  error?: string;
}