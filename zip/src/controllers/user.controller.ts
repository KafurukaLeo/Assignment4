import { type Request, type Response } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "../config/email";
import type { AuthRequest } from "../middlewares/auth.middleware";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

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

export const createUser = async (req: Request, res: Response) => {
  const { email, username, avatar, password } = req.body as {
    email?: string; username?: string; avatar?: string; password?: string;
  };

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Email, username, and password are required" });
  }

  try {
    const check = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (check) return res.status(409).json({ message: "Email or username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, username, avatar: avatar ?? null, password: hashed, name: username, role: "guest" },
    });

    res.status(201).json({ message: "User Created Successfully", newUser });
    sendEmail({ to: newUser.email, subject: "WELCOME", html: "<p>Welcome to our app!</p>" }).catch(console.error);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return res.status(409).json({ message: "Email or username already exists" });
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { name, email } = req.body as { name?: string; email?: string };

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
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

export const updateCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, bio, avatar } = req.body as {
      name?: string; email?: string; phone?: string; bio?: string; avatar?: string;
    };
    const updatedUser = await prisma.user.update({
      where: { id: req.userId! },
      data: {
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
