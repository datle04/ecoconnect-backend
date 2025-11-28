// src/routes/auth.routes.ts
import { Router } from 'express';
import { loginWithZalo } from '../controllers/auth.controller';

const router = Router();

router.post('/zalo/login', loginWithZalo);

export default router;