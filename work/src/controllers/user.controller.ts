import { type Request, type Response } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "../config/email";
import { hostStatusUpdateEmail, userBanStatusEmail } from "../templates/email";
import type { AuthRequest } from "../middlewares/auth.middleware";

/**
 * GET /api/v1/users
 * Returns all users (admin use).
 * - No pagination — returns all users at once
 * - Includes all fields (consider filtering sensitive fields in production)
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      }
    });
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

/**
 * PATCH /api/v1/users/:id/ban
 * Toggles a user's status between 'active' and 'banned' (admin use).
 */
export const toggleUserBan = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const newStatus = user.status === "banned" ? "active" : "banned";
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, name: true, status: true, email: true }
    });

    res.json({ 
      message: `User ${newStatus === "banned" ? "banned" : "reactivated"} successfully`, 
      data: updatedUser 
    });

    // Send email notification (best-effort)
    sendEmail({
      to: updatedUser.email,
      subject: "Account Status Update",
      html: userBanStatusEmail(updatedUser.name, newStatus),
    }).catch(console.error);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error toggling user ban" });
  }
};

/**
 * GET /api/v1/users/hosts
 * Returns all users with role 'host' (admin use).
 */
export const getHosts = async (req: Request, res: Response) => {
  try {
    const hosts = await prisma.user.findMany({
      where: { role: "host" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        avatar: true,
        bio: true,
        hostStatus: true,
        createdAt: true,
        _count: {
          select: { listings: true }
        },
        listings: {
          select: {
            _count: {
              select: { bookings: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedHosts = hosts.map(host => {
      const totalBookings = host.listings.reduce((sum, listing) => sum + listing._count.bookings, 0);
      const { listings: _, ...hostData } = host as any;
      return {
        ...hostData,
        _count: {
          listings: host._count.listings,
          bookings: totalBookings
        }
      };
    });

    res.json({ data: formattedHosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching hosts" });
  }
};

/**
 * PATCH /api/v1/users/hosts/:id/status
 * Updates a host's approval status (admin use).
 */
export const updateHostStatus = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { hostStatus } = req.body as { hostStatus: string };

  if (!["pending", "approved", "restricted"].includes(hostStatus)) {
    return res.status(400).json({ message: "Invalid host status" });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { hostStatus },
      select: {
        id: true,
        name: true,
        hostStatus: true,
      }
    });
    res.json({ message: "Host status updated successfully", user: updated });

    // Send email notification (best-effort)
    const host = await prisma.user.findUnique({ where: { id } });
    if (host) {
      sendEmail({
        to: host.email,
        subject: "Host Account Status Update",
        html: hostStatusUpdateEmail(host.name, hostStatus),
      }).catch(console.error);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating host status" });
  }
};

/**
 * POST /api/v1/users/become-host
 * Allows a guest user to apply to become a host.
 */
export const applyToBecomeHost = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "host") {
      return res.status(400).json({ message: "You are already a host" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "host",
        hostStatus: "pending"
      },
      select: {
        id: true,
        role: true,
        hostStatus: true
      }
    });

    res.json({
      message: "Application submitted successfully. An admin will review your account.",
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error applying for host status" });
  }
};

/**
 * GET /api/v1/users/favorites
 * Returns the currently authenticated user's favorite listings.
 */
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.userId! },
      include: {
        listing: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ 
      favorites: favorites.map(f => {
        const photos = JSON.parse(f.listing.photos || "[]");
        return {
          ...f,
          listing: {
            ...f.listing,
            photos,
            image: photos[0] || "", // For Navbar compatibility
            price: f.listing.pricePerNight, // For Navbar compatibility
            amenities: JSON.parse(f.listing.amenities || "[]")
          }
        };
      }) 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching favorites" });
  }
};

/**
 * POST /api/v1/users/favorites/:listingId
 * Adds a listing to the user's favorites.
 */
export const addFavorite = async (req: AuthRequest, res: Response) => {
  const listingId = req.params["listingId"] as string;

  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: req.userId!,
          listingId
        }
      }
    });

    if (existing) {
      return res.status(409).json({ message: "Already in favorites" });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.userId!,
        listingId
      }
    });

    res.status(201).json({ message: "Added to favorites", favorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding favorite" });
  }
};

/**
 * DELETE /api/v1/users/favorites/:listingId
 * Removes a listing from the user's favorites.
 */
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  const listingId = req.params["listingId"] as string;

  try {
    await prisma.favorite.delete({
      where: {
        userId_listingId: {
          userId: req.userId!,
          listingId
        }
      }
    });

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing favorite" });
  }
};

