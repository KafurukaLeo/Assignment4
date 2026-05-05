import { type Request, type Response } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "../config/email";
import type { AuthRequest } from "../middlewares/auth.middleware";

/**
 * GET /api/v1/users
 * Returns all users (admin use).
 * - No pagination — returns all users at once
 * - Includes all fields (consider filtering sensitive fields in production)
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

/**
 * GET /api/v1/users/:id
 * Returns a single user by their ID.
 * - Returns 404 if user doesn't exist
 */
export const getUserById = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

/**
 * POST /api/v1/users
 * Creates a new user (admin use — for registration use /auth/register instead).
 * - Required fields: email, username, password
 * - avatar is optional
 * - Returns 409 if email or username is already taken
 * - Hashes the password before storing
 * - Sends a welcome email after creation (non-blocking)
 * - Role defaults to "guest"
 */
export const createUser = async (req: Request, res: Response) => {
  const { email, username, avatar, password } = req.body as {
    email?: string; username?: string; avatar?: string; password?: string;
  };

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Email, username, and password are required" });
  }

  try {
    // Check if email or username is already in use
    const check = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (check) return res.status(409).json({ message: "Email or username already exists" });

    // Hash the password before storing
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, username, avatar: avatar ?? null, password: hashed, name: username, role: "guest" },
    });

    res.status(201).json({ message: "User Created Successfully", newUser });

    // Send welcome email after responding — failure here doesn't affect user creation
    sendEmail({ to: newUser.email, subject: "WELCOME", html: "<p>Welcome to our app!</p>" }).catch(console.error);
  } catch (error: unknown) {
    // Handle Prisma unique constraint violation (P2002) as a fallback
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return res.status(409).json({ message: "Email or username already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PUT /api/v1/users/:id
 * Updates a user's name and/or email (admin use).
 * - Both fields are optional — only provided fields are updated
 */
export const updateUser = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { name, email } = req.body as { name?: string; email?: string };

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        // Only update fields that were actually provided
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      },
    });
    res.json({ message: "User updated successfully", data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user" });
  }
};

/**
 * GET /api/v1/users/me
 * Returns the currently authenticated user's profile.
 * - Requires authentication (Bearer token)
 * - Uses userId from the JWT token (set by authenticate middleware)
 */
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching current user" });
  }
};

/**
 * PATCH /api/v1/users/me
 * Updates the currently authenticated user's profile.
 * - Requires authentication (Bearer token)
 * - Updatable fields: name, email, phone, bio, avatar
 * - All fields are optional — only provided fields are updated
 */
export const updateCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, bio, avatar } = req.body as {
      name?: string; email?: string; phone?: string; bio?: string; avatar?: string;
    };

    const updatedUser = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        // Only update fields that were actually provided
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
    });
    res.json({ message: "Profile updated successfully", data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

/**
 * DELETE /api/v1/users/:id
 * Permanently deletes a user account (admin use).
 * - This is a hard delete — the user record is removed from the database
 * - Related records (bookings, listings, reviews) may be cascade deleted
 *   depending on the Prisma schema configuration
 */
export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const deleted = await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully", data: deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting user" });
  }
};
