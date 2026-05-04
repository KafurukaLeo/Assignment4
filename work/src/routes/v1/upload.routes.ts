import { Router } from 'express';
import upload from "../../config/multer";
import { uploadAvatar } from "../../controllers/upload.controller";
import { authenticate } from "../../middlewares/auth.middleware";


const router = Router();


/**
 * @swagger
 * /upload/users/{id}/avatar:
 *   post:
 *     summary: Upload user avatar
 *     description: Upload a profile picture for the authenticated user. Accepts jpeg, png, and webp formats up to 5MB.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (jpeg, png, webp — max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Avatar uploaded successfully
 *                 url:
 *                   type: string
 *                   example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *       400:
 *         description: Invalid file format or size exceeds 5MB
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       500:
 *         description: Server error during upload
 */
// upload.single("image") — Multer middleware runs first
// "image" must match the field name in the multipart form
// authenticate — user must be logged in to upload

router.post("/users/:id/avatar", authenticate, upload.single("image"), uploadAvatar);

export default router;
