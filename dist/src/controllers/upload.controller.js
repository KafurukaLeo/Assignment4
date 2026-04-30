import { uploadToCloudinary } from "../config/cloudinary.js";
import prisma from "../config/prisma.js";
export async function uploadAvatar(req, res) {
    const id = req.params["id"];
    const file = req.file;
    // req.file is set by Multer — if it's missing, no file was sent
    if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
    });
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    // Upload the buffer to Cloudinary under the "airbnb/avatars" folder
    const { url } = await uploadToCloudinary(file.buffer, "airbnb/avatars");
    // Save the Cloudinary URL to the user's record in the database
    const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { avatar: url },
    });
    res.json({ message: "Avatar uploaded successfully", avatar: url });
}
//# sourceMappingURL=upload.controller.js.map