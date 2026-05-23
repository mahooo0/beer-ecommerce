'use client';

import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import * as Dialog from '@radix-ui/react-dialog';

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  aspect: number;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropModal({
  open,
  imageSrc,
  aspect,
  onCrop,
  onCancel,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    const canvas = document.createElement('canvas');
    const image = new window.Image();
    image.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.src = imageSrc;
    });

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    canvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      'image/webp',
      0.9
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-4 md:inset-[10%] bg-white rounded-lg z-50 flex flex-col">
          <Dialog.Title className="px-6 py-4 border-b text-lg font-semibold">
            Crop Image
          </Dialog.Title>

          <div className="relative flex-1 min-h-0">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="px-6 py-4 border-t space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCrop}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Crop & Upload
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
