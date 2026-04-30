import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from "cloudinary";
// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"] as string,
  api_key: process.env["CLOUDINARY_API_KEY"] as string,
  api_secret: process.env["CLOUDINARY_API_SECRET"] as string,
});

// Upload function
export async function uploadToCloudinary(fileBuffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" }, // // supports images, videos, etc.
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(fileBuffer);//  // Send file buffer to Cloudinary
  });
}
// Delete function
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
