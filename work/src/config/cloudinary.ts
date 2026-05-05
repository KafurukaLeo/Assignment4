import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from "cloudinary";

// Configure Cloudinary using credentials from environment variables
// These are set in .env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"] as string,
  api_key: process.env["CLOUDINARY_API_KEY"] as string,
  api_secret: process.env["CLOUDINARY_API_SECRET"] as string,
});

/**
 * uploadToCloudinary — uploads a file buffer to Cloudinary.
 * Uses upload_stream because we receive files as buffers from multer (memoryStorage).
 * Returns the public URL and public ID of the uploaded file.
 *
 * @param fileBuffer - The file data as a Buffer (from multer)
 * @param folder - The Cloudinary folder to store the file in (e.g. "airbnb/avatars")
 */
export async function uploadToCloudinary(fileBuffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" }, // "auto" supports images, videos, and other file types
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(fileBuffer); // Send the file buffer to Cloudinary
  });
}

/**
 * deleteFromCloudinary — deletes a file from Cloudinary by its public ID.
 * Used when a user's avatar is replaced or deleted.
 *
 * @param publicId - The Cloudinary public ID returned when the file was uploaded
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
