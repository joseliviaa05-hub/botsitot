import { Router } from 'express';
import productosController from '../controllers/productos.controller';

const router = Router();

router.get('/', productosController.getAll);
router.get('/:id', productosController.getById);
router.post('/', productosController.create);
router.put('/:id', productosController.update);
router.delete('/:id', productosController.delete);

export default router;
