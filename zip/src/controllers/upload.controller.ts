import type { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary";
import prisma from "../config/prisma";

export async function uploadAvatar(req: Request, res: Response) {
  const id = req.params["id"] as string;
  const file = (req as Request & { file?: Express.Multer.File }).file;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const { url } = await uploadToCloudinary(file.buffer, "airbnb/avatars");

  await prisma.user.update({ where: { id }, data: { avatar: url } });

  res.json({ message: "Avatar uploaded successfully", avatar: url });
}
