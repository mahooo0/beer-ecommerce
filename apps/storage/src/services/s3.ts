import { Client } from 'minio';
import { config } from '../config.js';

// S3-compatible client (MinIO). Talks to MinIO over the internal network
// endpoint; served object URLs use config.s3.publicUrl instead.
export const s3 = new Client({
  endPoint: config.s3.endpoint,
  port: config.s3.port,
  useSSL: config.s3.useSSL,
  accessKey: config.s3.accessKey,
  secretKey: config.s3.secretKey,
});

function publicReadPolicy(bucket: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

/**
 * Create the media bucket if it does not exist and make its objects publicly
 * readable. Idempotent — safe to call on every boot.
 */
export async function ensureBucket(): Promise<void> {
  const { bucket } = config.s3;
  const exists = await s3.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await s3.makeBucket(bucket);
    console.log(`[storage] created bucket "${bucket}"`);
  }
  try {
    await s3.setBucketPolicy(bucket, publicReadPolicy(bucket));
  } catch (err) {
    console.warn('[storage] could not set public bucket policy:', (err as Error).message);
  }
}
