import { type Request, type Response } from "express";
import prisma from "../config/prisma.js";

export const login = async (req: Request, res: Response) => {
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
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error during login" });
    }
};
