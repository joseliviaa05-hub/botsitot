// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Rol } from '@prisma/client';
import { prisma } from './prisma.service';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AuthTokenPayload,
  TokenVerifyResult,
} from '../types/auth.types';

class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly SALT_ROUNDS = 10;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET no configurado, usando valor por defecto (NO SEGURO)');
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await this.hashPassword(data.password);

    // Crear usuario
    const user = await prisma.usuario.create({
      data: {
        email: data.email,
        password: hashedPassword,
        nombre: data.nombre,
        rol: data.rol || Rol.VIEWER,
        activo: true,
      },
    });

    // Generar token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      rol: user.rol,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
      token,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * Login de usuario
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar que esté activo
    if (!user.activo) {
      throw new Error('Usuario inactivo');
    }

    // Verificar contraseña
    const isPasswordValid = await this.comparePassword(credentials.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      rol: user.rol,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
      token,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token: string): TokenVerifyResult {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as AuthTokenPayload;
      return {
        valid: true,
        payload,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Generar token JWT
   */
  generateToken(payload: AuthTokenPayload): string {
    const token = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        rol: payload.rol,
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
    return token;
  }

  /**
   * Hash de contraseña
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Comparar contraseña con hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string) {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Actualizar contraseña
   */
  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await this.comparePassword(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Hash de nueva contraseña
    const hashedPassword = await this.hashPassword(newPassword);

    // Actualizar
    await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Cambiar estado de usuario (activar/desactivar)
   */
  async toggleUserStatus(userId: string, activo: boolean) {
    return prisma.usuario.update({
      where: { id: userId },
      data: { activo },
    });
  }

  /**
   * Cambiar rol de usuario
   */
  async updateUserRole(userId: string, rol: Rol) {
    return prisma.usuario.update({
      where: { id: userId },
      data: { rol },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
      },
    });
  }

  /**
   * Listar todos los usuarios (solo admin)
   */
  async listUsers() {
    return prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export default new AuthService();
