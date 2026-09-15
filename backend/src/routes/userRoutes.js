import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

export function createUserRoutes(userController) {
  const router = Router();

  router.post('/register', userController.register);
  router.post('/login', userController.login);
  router.post('/logout', userController.logout);
  router.patch('/password', authMiddleware, userController.changePassword);

  return router;
}
