import { type Request, type Response } from "express";
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../config/email.js";

//  GET all users
export const getAllUsers = async(req: Request, res: Response) => {
 try {
  const users = await prisma.user.findMany();
  if (!users) {
    return res.status(404).json({ message: "No users found" });
  }
  res.json(users);
 } catch (error) {
  console.log(error)
 }
};

// GET user by ID
export const getUserById = async(req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
};

//  POST new user
export const createUser = async(req: Request, res: Response) => {
  const {  email, username, avator, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Email, username, and password are required" });
  }

 try {
  const check = await prisma.user.findFirst({
    where: {
      OR: [{email, username}]
    }
  })
  if (check) {
    return res.status(400).json({ message: "User with this email, username or phone already exists" });
  }
  const salt = await bcrypt.genSalt(20);
  const hashedPassword= await bcrypt.hash(password, salt)
   const newUser = await prisma.user.create({
    data:{
      email, username, avator, password: hashedPassword
    }
  });
  await sendEmail({to: newUser.email, subject: "WELCOME", text: "Welcome to our app!"});
  if (!newUser) {
    return res.status(500).json({ message: "Error creating user" });
  }
  res.status(201).json({message: "User Created Successfully",  newUser});

 } catch (error) {
  console.log(error)
 }
};

//  PUT (update user)
export const updateUser = async(req: Request, res: Response) => {
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error updating user" });
  }
};

  


// DELETE user
export const deleteUser = async(req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const deletedUser = await prisma.user.delete({
      where: { id }
    });
    res.json({ message: "User deleted successfully", data: deletedUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error deleting user" });
  }
};