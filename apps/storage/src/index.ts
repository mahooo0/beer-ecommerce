import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { config } from './config.js';
import uploadRoutes from './routes/upload.routes.js';
import { ensureBucket } from './services/s3.js';

const app = express();

// CORS
app.use(cors({
  origin: config.allowedOrigins,
  methods: ['GET', 'POST', 'DELETE'],
}));

app.use(express.json());

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// API routes
app.use(uploadRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'storage' });
});

// Error handling for multer errors
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: `File too large. Maximum size is ${config.maxFileSize / 1024 / 1024}MB` });
    return;
  }
  if (err.message) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  // Ensure uploads directory exists (legacy static serving / fallback)
  await fs.mkdir(config.uploadDir, { recursive: true });

  // Ensure the MinIO bucket exists and is publicly readable
  try {
    await ensureBucket();
    console.log(`[storage] object storage ready: bucket "${config.s3.bucket}" @ ${config.s3.endpoint}:${config.s3.port}`);
  } catch (err) {
    console.error('[storage] FAILED to init object storage:', (err as Error).message);
  }

  app.listen(config.port, () => {
    console.log(`Storage service running on port ${config.port}`);
    console.log(`Public URL: ${config.storageUrl}`);
  });
}

start();
