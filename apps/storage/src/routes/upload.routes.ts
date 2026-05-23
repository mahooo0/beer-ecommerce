import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { saveFile, deleteFile, type Preset } from '../services/storage.service.js';

const router: ReturnType<typeof Router> = Router();

const VALID_PRESETS = ['product', 'category', 'brand', 'collection', 'avatar'] as const;

function getPreset(req: Request): Preset | undefined {
  const preset = req.query.preset as string | undefined;
  if (preset && VALID_PRESETS.includes(preset as Preset)) {
    return preset as Preset;
  }
  return undefined;
}

// Single file upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const preset = getPreset(req);
    const record = await saveFile(req.file.buffer, req.file.originalname, preset);

    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    res.status(500).json({ error: message });
  }
});

// Multiple file upload
router.post('/upload/multiple', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided' });
      return;
    }

    const preset = getPreset(req);
    const records = await Promise.all(
      files.map((file) => saveFile(file.buffer, file.originalname, preset))
    );

    res.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    res.status(500).json({ error: message });
  }
});

// Delete file
router.delete('/files/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = await deleteFile(id);

    if (!deleted) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    res.status(500).json({ error: message });
  }
});

export default router;
