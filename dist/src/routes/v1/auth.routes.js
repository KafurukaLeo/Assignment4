import { Router } from "express";
import { login, register, changePassword, resetPassword, forgotPassword, me } from "../../controllers/auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
const router = Router();
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already in use
 */
router.post("/register", register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 userId:
 *                   type: string
 *                   example: cm7p6vx4x0000vswe5g7h5k9q
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);
router.get("/me", authenticate, me);
router.post("/change-password", authenticate, changePassword);
router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPassword);
export default router;
//# sourceMappingURL=auth.routes.js.map