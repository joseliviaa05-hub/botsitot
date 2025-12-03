import { Router } from 'express';
import { clientesController } from '../controllers/clientes.controller';

const router = Router();

router. get('/', clientesController.getAll);
router.  get('/:id', clientesController.getById);
router.post('/', clientesController.create);
router.put('/:id', clientesController.update);
router.delete('/:id', clientesController.delete);

export default router;
