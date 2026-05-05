import { type Request, type Response } from "express";
import crypto from "crypto";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { sendEmail } from "../config/email";
import { welcomeEmail, passwordResetEmail } from "../templates/email";

// Read JWT config from environment variables
const JWT_SECRET = process.env["JWT_SECRET"] as string;
const JWT_EXPIRES_IN = (process.env["JWT_EXPIRES_IN"] ?? "7d") as string;

/**
 * POST /api/v1/auth/register
 * Registers a new user account.
 * - Validates required fields: name, email, username, password
 * - Password must be at least 8 characters
 * - Role defaults to "guest" unless "host" is explicitly provided
 * - Returns 409 if email or username is already taken
 * - Sends a welcome email after successful registration (non-blocking)
 */
export const register = async (req: Request, res: Response) => {
  const { name, email, username, password, role } = req.body as {
    name?: string;
    email?: string;
    username?: string;
    password?: string;
    role?: string;
  };

  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: "name, email, username, and password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  // Only allow "host" or default to "guest" — prevents assigning "admin" via registration
  const assignedRole = role === "host" ? "host" : "guest";

  try {
    // Check if email or username is already in use
    const exists = await prisma.user.findUnique ({where: {email }});

    console.log(exists);
    
    if (exists) {
      return res.status(409).json({ error: "Email or username is already taken", conflict: exists.email === email ? "email" : "username" });
    }

    // Hash the password before storing — never store plain text passwords
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, username, password: hashed, role: assignedRole as "host" | "guest" },
    });

    // Remove sensitive fields before sending response
    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = user;

    res.status(201).json({ message: "Registered successfully", user: userWithoutPassword });

    // Send welcome email after responding — failure here doesn't affect the registration
    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Airbnb",
        html: welcomeEmail(user.name, user.role),
      });
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during registration" });
  }
};

/**
 * POST /api/v1/auth/login
 * Authenticates a user and returns a JWT token.
 * - Validates email and password are provided
 * - Returns 401 for both "user not found" and "wrong password" (same message for security)
 * - Token contains userId and role, expires based on JWT_EXPIRES_IN env variable
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Use same error message as wrong password to prevent user enumeration
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare provided password against the stored bcrypt hash
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Sign JWT with userId and role — used by authenticate middleware on protected routes
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    // Remove sensitive fields before sending response
    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during login" });
  }
};

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 * - Requires authentication (Bearer token)
 * - Hosts get their listings included
 * - Guests get their bookings (with listing details) included
 * - Admins get basic profile only
 */
export const me = async (req: AuthRequest, res: Response) => {
  try {
    let user;
    if (req.role === "host") {
      // Include listings for hosts so they can see what they own
      user = await prisma.user.findUnique({ where: { id: req.userId! }, include: { listings: true } });
    } else if (req.role === "guest") {
      // Include bookings with listing details for guests
      user = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: { bookings: { include: { listing: true } } },
      });
    } else {
      user = await prisma.user.findUnique({ where: { id: req.userId! } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove sensitive fields before sending response
    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching profile" });
  }
};

/**
 * POST /api/v1/auth/change-password
 * Allows an authenticated user to change their password.
 * - Requires authentication (Bearer token)
 * - Verifies the current password before allowing the change
 * - New password must be at least 8 characters
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify the current password is correct before allowing the change
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId! }, data: { password: hashed } });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error changing password" });
  }
};

/**
 * POST /api/v1/auth/forgot-password
 * Sends a password reset email to the user.
 * - Always returns the same response whether the email exists or not (prevents user enumeration)
 * - Generates a secure random token, hashes it, and stores it with a 1-hour expiry
 * - Sends the raw (unhashed) token in the reset link — only the hash is stored in DB
 */
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Respond immediately — same message regardless of whether email exists (security best practice)
  res.json({ message: "If that email is registered, a reset link has been sent" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silently exit if user doesn't exist

    // Generate a secure random token and hash it for storage
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: expiry },
    });

    // Send the raw token in the link — it will be hashed again on reset to verify
    const resetLink = `${process.env["API_URL"] ?? "http://localhost:5000"}/api/v1/auth/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: passwordResetEmail(user.name, resetLink),
    });
  } catch (err) {
    console.error("Forgot password error:", err);
  }
};

/**
 * POST /api/v1/auth/reset-password/:token
 * Resets the user's password using a valid reset token.
 * - Token from the URL is hashed and compared against the stored hash
 * - Token must not be expired (checked via resetTokenExpiry)
 * - Clears the reset token after successful reset to prevent reuse
 */
export const resetPassword = async (req: Request, res: Response) => {
  const rawToken = req.params["token"] as string;
  const { password } = req.body as { password?: string };

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    // Hash the token from the URL to compare with the stored hash
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Find user with matching token that hasn't expired yet
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }, // Token must still be valid
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Update password and clear the reset token so it can't be reused
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error resetting password" });
  }
};
