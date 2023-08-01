import express from 'express';
import * as authController from 'controllers/auth.controller';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/refreshToken', authController.refreshToken);

router.post('/resetPassword/:saltToken', authController.resetPassword);

export default router;
