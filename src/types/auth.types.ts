// ═══════════════════════════════════════════════════════════════
// AUTH TYPES
// Tipos para autenticación y autorización
// ═══════════════════════════════════════════════════════════════

import { Request } from 'express';
import { Rol } from '@prisma/client';

// ─────────────────────────────────────────────────────────────
// Login & Register
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// JWT Token
// ─────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
  userId: string;
  email: string;
  rol: Rol;
}

export interface TokenVerifyResult {
  valid: boolean;
  payload?: AuthTokenPayload;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Auth Response
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// AuthRequest - Request con usuario autenticado
// ─────────────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  usuario?: {
    id: string;
    email: string;
    rol: Rol;
    nombre?: string;
    activo: boolean;
  };
}
