import multer from "multer";

/**
 * Multer upload middleware — configured to store files in memory as Buffers.
 * memoryStorage() keeps the file in RAM instead of writing it to disk.
 * This is required because we pass the file buffer directly to Cloudinary
 * via uploadToCloudinary() in the upload controller.
 *
 * Usage in routes:
 *   router.post("/avatar/:id", upload.single("avatar"), uploadAvatar);
 *
 * "single" means only one file is accepted per request.
 * The string passed to single() is the form field name expected in the request.
 */
const upload = multer({ storage: multer.memoryStorage() });

export default upload;
