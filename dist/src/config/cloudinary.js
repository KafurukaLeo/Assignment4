import { v2 as cloudinary } from "cloudinary";
// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
    api_key: process.env["CLOUDINARY_API_KEY"],
    api_secret: process.env["CLOUDINARY_API_SECRET"],
});
// Upload function
export async function uploadToCloudinary(fileBuffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "auto" }, // // supports images, videos, etc.
        (error, result) => {
            if (error || !result)
                return reject(error);
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        stream.end(fileBuffer); //  // Send file buffer to Cloudinary
    });
}
// Delete function
export async function deleteFromCloudinary(publicId) {
    await cloudinary.uploader.destroy(publicId);
}
export default cloudinary;
//# sourceMappingURL=cloudinary.js.map