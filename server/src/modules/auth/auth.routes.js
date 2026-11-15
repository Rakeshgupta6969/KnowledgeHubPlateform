const express = require('express');
const authController = require('./auth.controller');
const { validateBody } = require('../../middleware/validate');
const { registerSchema, loginSchema } = require('./auth.validation');
const authMiddleware = require('../../middleware/auth');
const { loginLimiter, registerLimiter } = require('../../middleware/rateLimit');

const router = express.Router();

router.post('/register', registerLimiter, validateBody(registerSchema), authController.register);
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
