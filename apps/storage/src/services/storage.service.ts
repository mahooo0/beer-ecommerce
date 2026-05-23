import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';

export type Preset = 'product' | 'category' | 'brand' | 'collection' | 'avatar';

interface PresetConfig {
  maxWidth: number;
  maxHeight: number;
}

const PRESET_DIMENSIONS: Record<Preset, PresetConfig> = {
  product: { maxWidth: 800, maxHeight: 800 },
  category: { maxWidth: 1920, maxHeight: 600 },
  brand: { maxWidth: 400, maxHeight: 400 },
  collection: { maxWidth: 1920, maxHeight: 600 },
  avatar: { maxWidth: 200, maxHeight: 200 },
};

export interface FileRecord {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  preset?: Preset
): Promise<FileRecord> {
  const id = uuidv4();
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const dirPath = path.join(config.uploadDir, year, month);
  await fs.mkdir(dirPath, { recursive: true });

  const filename = `${id}.webp`;
  const filePath = path.join(dirPath, filename);

  let pipeline = sharp(buffer);

  if (preset && PRESET_DIMENSIONS[preset]) {
    const { maxWidth, maxHeight } = PRESET_DIMENSIONS[preset];
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const output = await pipeline.webp({ quality: 85 }).toBuffer();
  await fs.writeFile(filePath, output);

  const relativePath = `uploads/${year}/${month}/${filename}`;
  const url = `${config.storageUrl}/${relativePath}`;

  return {
    id,
    url,
    filename,
    size: output.length,
    mimeType: 'image/webp',
  };
}

export async function deleteFile(id: string): Promise<boolean> {
  // Search for the file in uploads directory
  const uploadsDir = config.uploadDir;

  try {
    const years = await fs.readdir(uploadsDir);
    for (const year of years) {
      const yearPath = path.join(uploadsDir, year);
      const stat = await fs.stat(yearPath);
      if (!stat.isDirectory()) continue;

      const months = await fs.readdir(yearPath);
      for (const month of months) {
        const filePath = path.join(yearPath, month, `${id}.webp`);
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          return true;
        } catch {
          // File not in this directory, continue
        }
      }
    }
  } catch {
    // uploads directory doesn't exist yet
  }

  return false;
}
