import { v2 as cloudinary } from "cloudinary";
export declare function uploadToCloudinary(fileBuffer: Buffer, folder: string): Promise<{
    url: string;
    publicId: string;
}>;
export declare function deleteFromCloudinary(publicId: string): Promise<void>;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map