import type { Request, Response } from 'express';
import { uploadToCloudinary } from '../config/cloudinary.js';
import prisma from '../config/prisma.js';

export async function uploadAvatar(req: Request, res: Response) {
    const id = parseInt(req.params["id"] as string);
    const file = (req as Request & { file?: Express.Multer.File }).file;

    // req.file is set by Multer — if it's missing, no file was sent
    if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const users = await prisma.user.findUnique({ where: { id } });
    if (!users) {
        return res.status(404).json({ error: "user not found" });
    }

    // Upload the buffer to Cloudinary under the "airbnb/avatars" folder
    const { url, publicId } = await uploadToCloudinary(file.buffer, "airbnb/avatars");

    // Save the Cloudinary URL to the user's record in the database
    const updatedUser = await prisma.user.update({
        where: { id },
        data: { avatarUrl: url, avatarPublicId: publicId },
    });

    res.json({ message: "Avatar uploaded successfully", avatarUrl: url });
}
