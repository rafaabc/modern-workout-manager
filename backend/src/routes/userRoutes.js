import { Router } from 'express';

export function createUserRoutes(userController) {
  const router = Router();

  router.post('/register', userController.register);
  router.post('/login', userController.login);
  router.post('/logout', userController.logout);

  return router;
}
