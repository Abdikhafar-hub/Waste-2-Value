const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { authLimiter } = require('../../middlewares/rateLimiters');
const controller = require('./auth.controller');
const schemas = require('./auth.validators');

const router = Router();

router.post('/login', authLimiter, validate(schemas.loginSchema), controller.login);
router.post('/refresh', authLimiter, validate(schemas.refreshSchema), controller.refresh);
router.post('/logout', authenticate, validate(schemas.logoutSchema), controller.logout);
router.get('/me', authenticate, controller.me);
router.post('/change-password', authenticate, validate(schemas.changePasswordSchema), controller.changePassword);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(schemas.resetPasswordSchema), controller.resetPassword);

module.exports = router;
