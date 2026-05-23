import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { config } from './config.js';
import uploadRoutes from './routes/upload.routes.js';

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
  // Ensure uploads directory exists
  await fs.mkdir(config.uploadDir, { recursive: true });

  app.listen(config.port, () => {
    console.log(`Storage service running on port ${config.port}`);
    console.log(`Public URL: ${config.storageUrl}`);
  });
}

start();
