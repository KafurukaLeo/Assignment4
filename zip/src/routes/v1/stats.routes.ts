import { Router } from "express";
import { getStats } from "../../controllers/stats.controller";

const router = Router();

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Get platform statistics
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: integer
 *                       example: 150
 *                     listings:
 *                       type: integer
 *                       example: 45
 *                     bookings:
 *                       type: integer
 *                       example: 320
 *                     reviews:
 *                       type: integer
 *                       example: 280
 *                     averageRating:
 *                       type: number
 *                       example: 4.5
 *       500:
 *         description: Error fetching statistics
 */
router.get("/", getStats);

export default router;
