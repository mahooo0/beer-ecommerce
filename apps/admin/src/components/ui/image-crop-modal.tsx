'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Loader2, RotateCcw, Wand2, ZoomIn, ZoomOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { showError } from '@/lib/toast';

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  aspect: number;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
  /** Show the "remove background" tool (product shots only). */
  allowBackgroundRemoval?: boolean;
}

// Checkerboard so transparency is visible once the background is removed.
const CHECKERBOARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(45deg, #d4d4d8 25%, transparent 25%), linear-gradient(-45deg, #d4d4d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d8 75%), linear-gradient(-45deg, transparent 75%, #d4d4d8 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
};

export function ImageCropModal({
  open,
  imageSrc,
  aspect,
  onCrop,
  onCancel,
  allowBackgroundRemoval = false,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // The image currently shown in the cropper — original or background-removed.
  const [activeSrc, setActiveSrc] = useState(imageSrc);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgProgress, setBgProgress] = useState(0);
  const [isCropping, setIsCropping] = useState(false);

  // Track object URLs we create so we can revoke them and avoid leaks.
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Reset everything whenever a new source image is loaded into the modal.
  useEffect(() => {
    setActiveSrc(imageSrc);
    setBgRemoved(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    revokeObjectUrl();
  }, [imageSrc, revokeObjectUrl]);

  useEffect(() => () => revokeObjectUrl(), [revokeObjectUrl]);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleRemoveBackground = async () => {
    if (isRemovingBg) return;
    setIsRemovingBg(true);
    setBgProgress(0);

    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(activeSrc, {
        output: { format: 'image/png' },
        progress: (_key, current, total) => {
          if (total > 0) setBgProgress(Math.round((current / total) * 100));
        },
      });

      revokeObjectUrl();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setActiveSrc(url);
      setBgRemoved(true);
    } catch (err) {
      console.error('Background removal failed:', err);
      showError('Could not remove the background. Please try again.');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleRestoreBackground = () => {
    revokeObjectUrl();
    setActiveSrc(imageSrc);
    setBgRemoved(false);
  };

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsCropping(true);

    try {
      const canvas = document.createElement('canvas');
      const image = new window.Image();
      image.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = activeSrc;
      });

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsCropping(false);
        return;
      }

      // Keep transparency (e.g. after background removal) in the output.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      await new Promise<void>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) onCrop(blob);
            resolve();
          },
          'image/webp',
          0.95
        );
      });
    } catch (err) {
      console.error('Crop failed:', err);
      showError('Could not process the image. Please try again.');
      setIsCropping(false);
    }
  };

  const busy = isRemovingBg || isCropping;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent className="flex h-[85vh] max-h-[720px] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>
            Drag to reposition and use the slider to zoom.
            {allowBackgroundRemoval && ' You can also remove the background.'}
          </DialogDescription>
        </DialogHeader>

        {/* Cropper */}
        <div className="relative flex-1 min-h-0" style={CHECKERBOARD}>
          <Cropper
            image={activeSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{ containerStyle: { background: 'transparent' } }}
          />

          {isRemovingBg && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
              <Loader2 className="size-8 animate-spin text-primary" />
              <div className="text-sm font-medium text-foreground">
                Removing background… {bgProgress > 0 ? `${bgProgress}%` : ''}
              </div>
              <p className="max-w-xs text-center text-xs text-muted-foreground">
                The AI model is downloaded once and may take a moment the first time.
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 border-t px-6 py-4">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={busy}
              aria-label="Zoom"
              className="h-1.5 flex-1 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
            <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {zoom.toFixed(1)}×
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {allowBackgroundRemoval &&
                (bgRemoved ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRestoreBackground}
                    disabled={busy}
                  >
                    <RotateCcw className="size-4" />
                    Restore background
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveBackground}
                    disabled={busy}
                  >
                    {isRemovingBg ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Wand2 className="size-4" />
                    )}
                    Remove background
                  </Button>
                ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleCrop} disabled={busy}>
                {isCropping && <Loader2 className="size-4 animate-spin" />}
                Crop & upload
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
