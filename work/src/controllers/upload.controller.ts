import type { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary";
import prisma from "../config/prisma";

/**
 * POST /api/v1/upload/avatar/:id
 * Uploads a user's avatar image to Cloudinary and updates their profile.
 * - Requires a file to be attached (multipart/form-data)
 * - Returns 400 if no file is provided
 * - Returns 404 if the user doesn't exist
 * - Uploads the file buffer to Cloudinary under the "airbnb/avatars" folder
 * - Saves the returned Cloudinary URL to the user's avatar field in the database
 */
export async function uploadAvatar(req: Request, res: Response) {
  const id = req.params["id"] as string;

  // Get the uploaded file from multer middleware
  const file = (req as Request & { file?: Express.Multer.File }).file;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  // Verify the user exists before uploading
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Upload the file buffer to Cloudinary and get the public URL
  const { url } = await uploadToCloudinary(file.buffer, "airbnb/avatars");

  // Save the Cloudinary URL to the user's profile
  await prisma.user.update({ where: { id }, data: { avatar: url } });

  res.json({ message: "Avatar uploaded successfully", avatar: url });
}
