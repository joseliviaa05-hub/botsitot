import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();
const execAsync = promisify(exec);

// Secret token para proteger endpoints (cambiar por uno seguro)
const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'change-me-in-production';

// Middleware de autenticación simple
const requireSecret = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['x-migration-token'];

  if (token !== MIGRATION_SECRET) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
};

// ═══════════════════════════════════════════════════════════
// POST /admin/migrate - Ejecutar migraciones
// ═══════════════════════════════════════════════════════════
router.post('/migrate', requireSecret, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');

    res.json({
      success: true,
      stdout,
      stderr,
      message: 'Migraciones ejecutadas correctamente',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /admin/create-admin - Crear usuario admin
// ═══════════════════════════════════════════════════════════
router.post('/create-admin', requireSecret, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, nombre } = req.body;

    if (!email || !password || !nombre) {
      res.status(400).json({ error: 'Email, password y nombre requeridos' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    const admin = await prisma.usuario.create({
      data: {
        email,
        password: hash,
        nombre,
        rol: 'ADMIN',
      },
    });

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre,
        rol: admin.rol,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /admin/db-status - Ver estado de la DB
// ═══════════════════════════════════════════════════════════
router.get('/db-status', requireSecret, async (_req: Request, res: Response): Promise<void> => {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    const usuariosCount = await prisma.usuario.count();
    const productosCount = await prisma.producto.count();
    const pedidosCount = await prisma.pedido.count();

    res.json({
      success: true,
      tables,
      counts: {
        usuarios: usuariosCount,
        productos: productosCount,
        pedidos: pedidosCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
