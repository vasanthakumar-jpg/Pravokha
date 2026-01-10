import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../../utils/asyncHandler';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
    }
});

export class UploadController {
    static uploadSingle = [
        upload.single('file'),
        asyncHandler(async (req: any, res: Response) => {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            // Create public URL (assuming the backend serves static files from /uploads)
            const publicUrl = `/uploads/${req.file.filename}`;

            res.json({
                success: true,
                url: publicUrl,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });
        })
    ];

    static uploadMultiple = [
        upload.array('files', 10),
        asyncHandler(async (req: any, res: Response) => {
            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                return res.status(400).json({ success: false, message: 'No files uploaded' });
            }

            const urls = files.map(file => `/uploads/${file.filename}`);

            res.json({
                success: true,
                urls
            });
        })
    ];
}
