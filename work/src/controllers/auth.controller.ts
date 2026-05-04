import { type Request, type Response } from "express";
import crypto from "crypto";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { sendEmail } from "../config/email";
import { welcomeEmail, passwordResetEmail } from "../templates/email";

const JWT_SECRET = process.env["JWT_SECRET"] as string;
const JWT_EXPIRES_IN = (process.env["JWT_EXPIRES_IN"] ?? "7d") as string;

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

  const assignedRole = role === "host" ? "host" : "guest";

  try {
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (exists) {
      return res.status(409).json({ error: "Email or username is already taken", conflict: exists.email === email ? "email" : "username" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, username, password: hashed, role: assignedRole as "host" | "guest" },
    });

    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = user;

    res.status(201).json({ message: "Registered successfully", user: userWithoutPassword });

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

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error during login" });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    let user;
    if (req.role === "host") {
      user = await prisma.user.findUnique({ where: { id: req.userId! }, include: { listings: true } });
    } else if (req.role === "guest") {
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

    const { password: _, resetToken: __, resetTokenExpiry: ___, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching profile" });
  }
};

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

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Always return the same response regardless of whether the email exists
  res.json({ message: "If that email is registered, a reset link has been sent" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: expiry },
    });

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
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const hashed = await bcrypt.hash(password, 10);
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
