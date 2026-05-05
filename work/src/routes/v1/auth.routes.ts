// Express Router — creates a modular route handler for auth endpoints
import { Router } from "express";
// Auth controller functions for registration, login, and password management
import { login, register, changePassword, resetPassword, forgotPassword, me } from "../../controllers/auth.controller";
// authenticate middleware — verifies JWT token, required for protected routes like /me
import { authenticate } from "../../middlewares/auth.middleware";

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Alice Smith
 *         email:
 *           type: string
 *           example: alice@example.com
 *         username:
 *           type: string
 *           example: alice
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+250788000000"
 *         role:
 *           type: string
 *           enum: [host, guest, admin]
 *           example: guest
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg"
 *         bio:
 *           type: string
 *           nullable: true
 *           example: I love traveling!
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     RegisterInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - username
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: Alice Smith
 *         email:
 *           type: string
 *           example: alice@example.com
 *         username:
 *           type: string
 *           example: alice
 *         password:
 *           type: string
 *           example: mypassword123
 *         role:
 *           type: string
 *           enum: [host, guest]
 *           example: guest
 *
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: alice@example.com
 *         password:
 *           type: string
 *           example: mypassword123
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Resource not found
 *
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Cozy apartment in Kigali
 *         description:
 *           type: string
 *           example: A beautiful apartment with stunning city views
 *         location:
 *           type: string
 *           example: Kigali, Rwanda
 *         pricePerNight:
 *           type: number
 *           example: 85.00
 *         guests:
 *           type: integer
 *           example: 4
 *         type:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *           example: apartment
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: [WiFi, Pool, AC]
 *         rating:
 *           type: number
 *           nullable: true
 *           example: 4.5
 *         hostId:
 *           type: integer
 *           example: 1
 *         host:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     CreateListingInput:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *         - pricePerNight
 *         - guests
 *         - type
 *       properties:
 *         title:
 *           type: string
 *           example: Cozy apartment in Kigali
 *         description:
 *           type: string
 *           example: A beautiful apartment with stunning city views
 *         location:
 *           type: string
 *           example: Kigali, Rwanda
 *         pricePerNight:
 *           type: number
 *           example: 85.00
 *         guests:
 *           type: integer
 *           example: 4
 *         type:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *           example: apartment
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: [WiFi, Pool]
 *
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2025-06-01T00:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: "2025-06-07T00:00:00.000Z"
 *         totalPrice:
 *           type: number
 *           example: 595.00
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *           example: pending
 *         guestId:
 *           type: integer
 *           example: 2
 *         listingId:
 *           type: integer
 *           example: 1
 *         guest:
 *           $ref: '#/components/schemas/User'
 *         listing:
 *           $ref: '#/components/schemas/Listing'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     CreateBookingInput:
 *       type: object
 *       required:
 *         - listingId
 *         - checkIn
 *         - checkOut
 *       properties:
 *         listingId:
 *           type: integer
 *           example: 1
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2025-06-01T00:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: "2025-06-07T00:00:00.000Z"
 *
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         comment:
 *           type: string
 *           nullable: true
 *           example: Great place to stay!
 *         userId:
 *           type: integer
 *           example: 2
 *         listingId:
 *           type: integer
 *           example: 1
 *         user:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     CreateReviewInput:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         comment:
 *           type: string
 *           example: Great place to stay!
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 100
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalPages:
 *           type: integer
 *           example: 10
 *
 *     PaginatedUserResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         meta:
 *           $ref: '#/components/schemas/PaginationMeta'
 *
 *     PaginatedListingResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Listing'
 *         meta:
 *           $ref: '#/components/schemas/PaginationMeta'
 *
 *     PaginatedBookingResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Booking'
 *         meta:
 *           $ref: '#/components/schemas/PaginationMeta'
 *
 *     PaginatedReviewResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *         meta:
 *           $ref: '#/components/schemas/PaginationMeta'
 *
 *     ListingStats:
 *       type: object
 *       properties:
 *         totalListings:
 *           type: integer
 *           example: 120
 *         averagePrice:
 *           type: number
 *           example: 145.50
 *         byLocation:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           example: { "Kigali": 30, "Nairobi": 20 }
 *         byType:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           example: { "apartment": 45, "house": 30 }
 */

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
 *       '201':
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: Missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Email or username already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *       '200':
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       '400':
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: No token provided or token is invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", authenticate, me);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password changed successfully
 *       '400':
 *         description: Missing required fields or invalid current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/change-password", authenticate, changePassword);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password reset email sent (same response whether email exists or not)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email sent
 *       '400':
 *         description: Email is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password reset successfully
 *       '400':
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/reset-password/:token", resetPassword);

export default router;
