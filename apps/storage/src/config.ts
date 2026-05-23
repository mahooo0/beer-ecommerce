import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.STORAGE_PORT || '4001', 10),
  storageUrl: process.env.STORAGE_URL || 'http://localhost:4001',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3002,http://localhost:3003').split(','),
};
