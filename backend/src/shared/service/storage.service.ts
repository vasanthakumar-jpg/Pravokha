import fs from 'fs';
import path from 'path';
import { config } from '../../core/config/env';

/**
 * Storage Service Abstraction
 * Currently handles local file system uploads.
 * Future-Proof: Can be extended to AWS S3 or Cloudinary by changing the implementation here.
 */
export class StorageService {
    private static uploadDir = path.join(__dirname, '../../../../uploads');

    /**
     * Upload a file and return the public URL
     * This is an abstraction to hide the storage logic from the controllers
     */
    static async uploadFile(file: Express.Multer.File): Promise<string> {
        // Implementation for Local Storage
        // If switching to S3, replace this logic with S3.upload()
        const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`;
        const filePath = path.join(this.uploadDir, fileName);

        // Ensure directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }

        // Save file
        fs.writeFileSync(filePath, file.buffer);

        // Return URL
        return `${config.backendUrl}/uploads/${fileName}`;
    }

    /**
     * Delete a file from storage
     */
    static async deleteFile(fileUrl: string): Promise<void> {
        try {
            const fileName = path.basename(fileUrl);
            const filePath = path.join(this.uploadDir, fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('[StorageService] Delete Error:', error);
        }
    }
}
