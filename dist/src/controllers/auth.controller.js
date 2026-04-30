import {} from "express";
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        res.json({ message: "Login successful", userId: user.id });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error during login" });
    }
};
export const register = async (req, res) => {
    const { email, username, password, name, role } = req.body;
    if (!email || !username || !password || !name || !role)
        return res.status(400).json({ message: "Email, username, and password are required" });
    try {
        const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
        if (exists)
            return res.status(400).json({ message: "User already exists" });
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { email, username, password: hashed, name: username, role: 'guest' } });
        res.status(201).json({ message: "Registered successfully", user });
    }
    catch (error) {
        res.status(500).json({ message: "Error during registration" });
    }
};
export const changePassword = async (req, res) => {
    res.json({ message: "Change password endpoint" });
};
export const resetPassword = async (req, res) => {
    res.json({ message: "Reset password endpoint" });
};
export const forgotPassword = async (req, res) => {
    res.json({ message: "Forgot password endpoint" });
};
export const me = async (req, res) => {
    res.json({ message: "Authenticated user endpoint" });
};
//# sourceMappingURL=auth.controller.js.map