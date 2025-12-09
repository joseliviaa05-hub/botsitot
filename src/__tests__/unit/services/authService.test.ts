// src/__tests__/unit/services/authService.test.ts
import authService from '../../../services/auth.service';
import { prisma } from '../../../services/prisma.service';
import { Rol } from '@prisma/client';
import { cleanupTestData, createTestUser } from '../../helpers';

describe('AuthService', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('register', () => {
    it('debe registrar un nuevo usuario', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        nombre: 'Test User',
      };

      const result = await authService.register(userData);

      expect(result). toHaveProperty('user');
      expect(result). toHaveProperty('token');
      expect(result). toHaveProperty('expiresIn');
      expect(result.user. email).toBe(userData.email);
      expect(result.user.nombre).toBe(userData. nombre);
      expect(result. user.rol).toBe(Rol.VIEWER); // Por defecto
    });

    it('debe asignar rol ADMIN si se especifica', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'Password123!',
        nombre: 'Admin User',
        rol: Rol.ADMIN,
      };

      const result = await authService.register(userData);

      expect(result. user.rol).toBe(Rol.ADMIN);
    });

    it('debe lanzar error si el email ya existe', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        nombre: 'User 1',
      };

      await authService.register(userData);

      await expect(
        authService.register({
          ... userData,
          nombre: 'User 2',
        })
      ).rejects. toThrow('El email ya está registrado');
    });

    it('debe hashear la contraseña', async () => {
      const userData = {
        email: 'hash@example.com',
        password: 'Password123!',
        nombre: 'Hash User',
      };

      const result = await authService.register(userData);

      // Buscar usuario en BD
      const user = await prisma.usuario.findUnique({
        where: { email: userData. email },
      });

      expect(user). toBeTruthy();
      expect(user! .password).not.toBe(userData.password); // No debe estar en texto plano
      expect(user!.password).toMatch(/^\$2[aby]\$\d+\$/); // Formato bcrypt
    });
  });

  describe('login', () => {
    it('debe hacer login con credenciales válidas', async () => {
      const password = 'Password123!';
      const user = await createTestUser({
        email: 'login@example. com',
        password,
        nombre: 'Login User',
      });

      const result = await authService.login({
        email: user.email,
        password,
      });

      expect(result). toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result. user.email).toBe(user.email);
    });

    it('debe lanzar error con email inválido', async () => {
      await expect(
        authService.login({
          email: 'noexiste@example.com',
          password: 'cualquiera',
        })
      ). rejects.toThrow('Credenciales inválidas');
    });

    it('debe lanzar error con contraseña inválida', async () => {
      const user = await createTestUser({
        email: 'wrongpass@example.com',
        password: 'CorrectPassword123!',
        nombre: 'User',
      });

      await expect(
        authService.login({
          email: user.email,
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('debe lanzar error si usuario está inactivo', async () => {
      const password = 'Password123!';
      const user = await createTestUser({
        email: 'inactive@example.com',
        password,
        nombre: 'Inactive User',
        activo: false,
      });

      await expect(
        authService.login({
          email: user.email,
          password,
        })
      ).rejects.toThrow('Usuario inactivo');
    });
  });

  describe('verifyToken', () => {
    it('debe verificar un token válido', async () => {
      const token = authService.generateToken({
        userId: '123',
        email: 'test@example.com',
        rol: Rol.ADMIN,
      });

      const result = authService.verifyToken(token);

      expect(result. valid).toBe(true);
      expect(result.payload). toHaveProperty('userId', '123');
      expect(result.payload).toHaveProperty('email', 'test@example.com');
      expect(result. payload).toHaveProperty('rol', Rol.ADMIN);
    });

    it('debe rechazar token inválido', () => {
      const result = authService.verifyToken('token-invalido');

      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('hashPassword & comparePassword', () => {
    it('debe hashear y comparar contraseñas correctamente', async () => {
      const password = 'MySecurePassword123!';
      const hash = await authService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);

      const isValid = await authService.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('debe rechazar contraseña incorrecta', async () => {
      const password = 'CorrectPassword';
      const hash = await authService.hashPassword(password);

      const isValid = await authService. comparePassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('getUserById', () => {
    it('debe obtener usuario por ID', async () => {
      const created = await createTestUser({
        email: 'getbyid@example.com',
        password: 'Password123!',
        nombre: 'Get By ID User',
      });

      const user = await authService.getUserById(created.id);

      expect(user).toBeTruthy();
      expect(user.id).toBe(created.id);
      expect(user.email). toBe(created.email);
      expect(user). not.toHaveProperty('password'); // No debe incluir password
    });

    it('debe lanzar error si usuario no existe', async () => {
      await expect(
        authService.getUserById('id-inexistente')
      ).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('updatePassword', () => {
    it('debe actualizar contraseña correctamente', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword123!';

      const user = await createTestUser({
        email: 'updatepass@example.com',
        password: oldPassword,
        nombre: 'Update Pass User',
      });

      await authService.updatePassword(user. id, oldPassword, newPassword);

      // Verificar que puede hacer login con nueva contraseña
      const result = await authService.login({
        email: user.email,
        password: newPassword,
      });

      expect(result).toBeTruthy();
      expect(result.user.email).toBe(user.email);
    });

    it('debe rechazar si contraseña actual es incorrecta', async () => {
      const user = await createTestUser({
        email: 'wrongold@example.com',
        password: 'CorrectPassword123!',
        nombre: 'User',
      });

      await expect(
        authService.updatePassword(user.id, 'WrongOldPassword', 'NewPassword123!')
      ).rejects. toThrow('Contraseña actual incorrecta');
    });
  });

  describe('toggleUserStatus', () => {
    it('debe desactivar usuario', async () => {
      const user = await createTestUser({
        email: 'toggle@example.com',
        password: 'Password123!',
        nombre: 'Toggle User',
        activo: true,
      });

      await authService.toggleUserStatus(user.id, false);

      const updated = await prisma.usuario.findUnique({
        where: { id: user.id },
      });

      expect(updated! .activo).toBe(false);
    });
  });

  describe('updateUserRole', () => {
    it('debe actualizar rol de usuario', async () => {
      const user = await createTestUser({
        email: 'updaterole@example.com',
        password: 'Password123! ',
        nombre: 'Update Role User',
        rol: Rol.VIEWER,
      });

      const updated = await authService.updateUserRole(user.id, Rol. ADMIN);

      expect(updated. rol).toBe(Rol. ADMIN);
    });
  });

  describe('listUsers', () => {
    it('debe listar todos los usuarios', async () => {
      // Crear varios usuarios
      await createTestUser({
        email: 'user1@example.com',
        password: 'Pass123!',
        nombre: 'User 1',
      });
      await createTestUser({
        email: 'user2@example.com',
        password: 'Pass123!',
        nombre: 'User 2',
      });

      const users = await authService.listUsers();

      expect(users. length).toBeGreaterThanOrEqual(2);
      expect(users[0]). not.toHaveProperty('password'); // No debe incluir passwords
    });
  });
});