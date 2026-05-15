import { type Request, type Response } from "express";
import crypto from "crypto";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { formatListing } from "../utils/listing";
import { sendEmail } from "../config/email";
import {
  welcomeEmail,
  passwordResetEmail,
  emailVerificationEmail,
  accountLockedEmail,
} from "../templates/email";
import { validatePassword } from "../utils/password";

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

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  // FR-003: full password complexity check (8+ chars, uppercase, digit, special char)
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  // Allow "host", "admin", or default to "guest"
  const normalizedRole = role?.toLowerCase();
  const assignedRole = (normalizedRole === "host" || normalizedRole === "admin") 
    ? normalizedRole 
    : "guest";

  try {
    // Check if email or username is already in use
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] },
    });

    if (exists) {
      const conflict = exists.email === normalizedEmail ? "email" : "username";
      return res.status(409).json({ error: `${conflict} is already taken`, conflict });
    }

    // Hash the password before storing — never store plain text passwords
    const hashed = await bcrypt.hash(password, 10);

    // FR-002: generate a secure email verification token
    const rawVerifToken = crypto.randomBytes(32).toString("hex");

    const user = await prisma.user.create({
      data: {
        name, email: normalizedEmail, username: normalizedUsername, password: hashed, role: assignedRole,
        emailVerified: false,
        emailVerificationToken: rawVerifToken,
      },
    });

    // Sign JWT with userId and role so the user can be logged in automatically
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    // Remove sensitive fields before sending response
    const { password: _, resetToken: __, resetTokenExpiry: ___, emailVerificationToken: ____, ...userWithoutPassword } = user;

    res.status(201).json({ 
      message: "Registered successfully. Please check your email to verify your account.", 
      token, 
      user: userWithoutPassword 
    });

    // Send welcome + verification emails after responding (non-blocking)
    const verifyLink = `${process.env["API_URL"] ?? "http://localhost:3000"}/api/v1/auth/verify-email/${rawVerifToken}`;
    try {
      await sendEmail({ to: user.email, subject: "Verify your Airbnb email", html: emailVerificationEmail(user.name, verifyLink) });
      await sendEmail({ to: user.email, subject: "Welcome to Airbnb", html: welcomeEmail(user.name, user.role) });
    } catch (emailErr) {
      console.error("Welcome/verification email failed:", emailErr);
    }
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);
    res.status(500).json({ 
      error: "Error during registration", 
      message: error instanceof Error ? error.message : "An unknown error occurred" 
    });
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

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Use same error message as wrong password to prevent user enumeration
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({
        error: `Account is temporarily locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`,
        lockedUntil: user.lockUntil,
      });
    }

    // Block banned users from logging in
    if (user.status === "banned") {
      return res.status(403).json({ 
        error: "Your account has been banned by the administrator.",
        status: "banned"
      });
    }

    // Compare provided password against the stored bcrypt hash
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // FR-005: increment failed attempts; lock after 5
      const attempts = user.loginAttempts + 1;
      const shouldLock = attempts >= 5;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: shouldLock ? 0 : attempts,
          lockUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      if (shouldLock) {
        // Fire-and-forget lockout email
        sendEmail({ to: user.email, subject: "Your Airbnb account has been locked", html: accountLockedEmail(user.name) }).catch(console.error);
        return res.status(423).json({ error: "Account locked after 5 failed attempts. Try again in 15 minutes." });
      }
      return res.status(401).json({ error: "Invalid credentials", attemptsRemaining: 5 - attempts });
    }

    // Successful login — reset lockout counters
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockUntil: null },
    });

    // Sign JWT with userId and role — used by authenticate middleware on protected routes
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    // Remove sensitive fields before sending response
    const { password: _, resetToken: __, resetTokenExpiry: ___, emailVerificationToken: ____, loginAttempts: _____, lockUntil: ______, ...userWithoutPassword } = user;

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
    // Include both listings and bookings for all users to support multi-role accounts
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: {
        listings: true,
        bookings: {
          include: { listing: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove sensitive fields before sending response
    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = user as any;
    
    if (userWithoutPassword.listings) {
      userWithoutPassword.listings = userWithoutPassword.listings.map(formatListing);
    }
    if (userWithoutPassword.bookings) {
      userWithoutPassword.bookings = userWithoutPassword.bookings.map((b: any) => ({
        ...b,
        listing: formatListing(b.listing)
      }));
    }

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

  // FR-003: full password complexity check
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
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
 * POST /api/v1/auth/assign-role
 * Assigns a role to a user.
 * - Admin only
 */
export const assignRole = async (req: Request, res: Response) => {
  // Only admin can call this (middleware will enforce)
  const { userId, role } = req.body as { userId?: string; role?: string };
  if (!userId || !role) {
    return res.status(400).json({ error: 'userId and role are required' });
  }
  // Validate role value
  const allowedRoles = ['guest', 'host', 'admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of ${allowedRoles.join(', ')}` });
  }
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });
    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = updatedUser as any;
    res.json({ message: 'Role updated', user: userWithoutPassword });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: 'Error assigning role' });
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
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // FR-006: 30 minutes (SRS requirement)

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

  // FR-003: full password complexity check
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
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

/**
 * GET /api/v1/auth/verify-email/:token
 * FR-002: Verifies a user's email address using the token sent during registration.
 * - Token is stored as plain text (not hashed) since it's a one-time-use link
 * - Marks emailVerified = true and clears the verification token after use
 */
export const verifyEmail = async (req: Request, res: Response) => {
  const token = req.params["token"] as string;

  try {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification link" });
    }

    if (user.emailVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });

    // Redirect to frontend after verification
    const frontendUrl = process.env["FRONTEND_URL"] ?? "http://localhost:5173";
    return res.redirect(`${frontendUrl}/login?verified=true`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error verifying email" });
  }
};

/**
 * POST /api/v1/auth/resend-verification
 * FR-002: Resends the email verification link.
 * - Generates a fresh token and sends a new verification email
 */
export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email) return res.status(400).json({ error: "Email is required" });

  // Always respond the same way to prevent enumeration
  res.json({ message: "If that email is registered and unverified, a new verification link has been sent" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return;

    const rawVerifToken = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: rawVerifToken },
    });

    const verifyLink = `${process.env["API_URL"] ?? "http://localhost:3000"}/api/v1/auth/verify-email/${rawVerifToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your Airbnb email",
      html: emailVerificationEmail(user.name, verifyLink),
    });
  } catch (err) {
    console.error("Resend verification error:", err);
  }
};
