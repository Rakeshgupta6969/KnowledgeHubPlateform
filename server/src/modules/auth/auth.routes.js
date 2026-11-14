const express = require('express');
const authController = require('./auth.controller');
const { validateBody } = require('../../middleware/validate');
const { registerSchema, loginSchema } = require('./auth.validation');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
