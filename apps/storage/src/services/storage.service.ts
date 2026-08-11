import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { s3 } from './s3.js';

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

function objectUrl(key: string): string {
  return `${config.s3.publicUrl}/${config.s3.bucket}/${key}`;
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

  let pipeline = sharp(buffer);

  if (preset && PRESET_DIMENSIONS[preset]) {
    const { maxWidth, maxHeight } = PRESET_DIMENSIONS[preset];
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const output = await pipeline.webp({ quality: 85 }).toBuffer();

  const key = `uploads/${year}/${month}/${id}.webp`;
  await s3.putObject(config.s3.bucket, key, output, output.length, {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  return {
    id,
    url: objectUrl(key),
    filename: `${id}.webp`,
    size: output.length,
    mimeType: 'image/webp',
  };
}

export async function deleteFile(id: string): Promise<boolean> {
  // We only receive the id, not the full key, so find the object whose name
  // ends with `<id>.webp` under the uploads/ prefix and remove it.
  const suffix = `/${id}.webp`;

  return new Promise((resolve) => {
    const stream = s3.listObjectsV2(config.s3.bucket, 'uploads/', true);
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    stream.on('data', (obj) => {
      if (!settled && obj.name && obj.name.endsWith(suffix)) {
        s3.removeObject(config.s3.bucket, obj.name)
          .then(() => finish(true))
          .catch(() => finish(false));
        (stream as unknown as { destroy?: () => void }).destroy?.();
      }
    });
    stream.on('end', () => finish(false));
    stream.on('error', () => finish(false));
  });
}
