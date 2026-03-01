import { Router } from 'express';
import { activateClient, createClient, deleteClient, getClients, updateClient, updateClientBalance } from '../controllers/clientController.js';
import { validate } from '../middlewares/validateResource.js';
import { clientRegistrationSchema, updateClientSchema, updateBalanceSchema } from '../schemas/clientSchema.js';

const router = Router();

// 1. Registro
router.post('/create-client', validate(clientRegistrationSchema), createClient);

// 2. Listado
router.get('/', getClients);

// 3. Actualizar datos de perfil
router.put('/:id/update-client', validate(updateClientSchema), updateClient);

// 4. Ajustar balance (Usando el nuevo esquema)
router.patch('/:id/adjust-balance', validate(updateBalanceSchema), updateClientBalance);

// 5. Desactivar
router.delete('/:id/deactivate', deleteClient);

// 6. Activar cliente
router.patch('/:id/activate', activateClient);

export default router;