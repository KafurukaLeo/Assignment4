import {} from "express";
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../config/email.js";
//  GET all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        if (!users) {
            return res.status(404).json({ message: "No users found" });
        }
        res.json(users);
    }
    catch (error) {
        console.log(error);
    }
};
// GET user by ID
export const getUserById = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching user" });
    }
};
//  POST new user
export const createUser = async (req, res) => {
    const { email, username, avatar, password } = req.body;
    if (!email || !username || !password) {
        return res.status(400).json({ message: "Email, username, and password are required" });
    }
    try {
        const check = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }]
            }
        });
        if (check) {
            return res.status(400).json({ message: "User with this email or username already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await prisma.user.create({
            data: {
                email, username, avatar, password: hashedPassword, name: username, role: 'guest'
            }
        });
        res.status(201).json({ message: "User Created Successfully", newUser });
        sendEmail({ to: newUser.email, subject: "WELCOME", text: "Welcome to our app!" }).catch(console.error);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "User with this email or username already exists" });
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
//  PUT (update user)
export const updateUser = async (req, res) => {
    const id = Number(req.params.id);
    const { name, email } = req.body;
    if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, email }
        });
        res.json({ message: "User updated successfully", data: updatedUser });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error updating user" });
    }
};
// DELETE user
export const deleteUser = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    try {
        const deletedUser = await prisma.user.delete({
            where: { id }
        });
        res.json({ message: "User deleted successfully", data: deletedUser });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error deleting user" });
    }
};
//# sourceMappingURL=user.controller.js.map