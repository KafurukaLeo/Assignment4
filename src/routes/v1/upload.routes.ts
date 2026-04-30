import { Router } from 'express';
import upload from "../../config/multer.js";
import { uploadAvatar } from "../../controllers/upload.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";


const router = Router();


// upload.single("image") — Multer middleware runs first
// "image" must match the field name in the multipart form
// authenticate — user must be logged in to upload

router.post("/users/:id/avatar", authenticate, upload.single("image"), uploadAvatar);
/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (jpeg, png, webp — max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Invalid file format or size
 *       401:
 *         description: Unauthorized
 */

export default router;
