import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.STORAGE_PORT || '4001', 10),
  storageUrl: process.env.STORAGE_URL || 'http://localhost:4001',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3002,http://localhost:3003').split(','),
  // Object storage (MinIO / S3-compatible). Uploads go here instead of local disk.
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'localhost', // internal host, e.g. dev-minio
    port: parseInt(process.env.S3_PORT || '9000', 10),
    useSSL: process.env.S3_USE_SSL === 'true',
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
    bucket: process.env.S3_BUCKET || 'taranka-media',
    // Public base used to build served URLs, e.g. https://s3.dev.taranka.online
    publicUrl: (process.env.S3_PUBLIC_URL || 'http://localhost:9000').replace(/\/$/, ''),
  },
};
