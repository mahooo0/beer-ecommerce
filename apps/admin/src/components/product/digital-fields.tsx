'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormData } from '@repo/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DigitalFieldsProps {
  form: UseFormReturn<ProductFormData>;
}

export function DigitalFields({ form }: DigitalFieldsProps) {
  const errors = (form.formState.errors as any).digitalMeta;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Digital Product Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure the digital file details. Customers will receive download access after purchase.
        </p>
      </div>

      <div className="space-y-4">
        {/* File URL */}
        <div>
          <Label className="mb-1">
            File URL *
          </Label>
          <Input
            {...form.register('digitalMeta.fileUrl' as any)}
            type="url"
            placeholder="https://res.cloudinary.com/..."
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Full URL to the digital file (use Cloudinary or similar CDN)
          </p>
          {errors?.fileUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.fileUrl.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Name */}
          <div>
            <Label className="mb-1">
              File Name *
            </Label>
            <Input
              {...form.register('digitalMeta.fileName' as any)}
              type="text"
              placeholder="product-manual.pdf"
            />
            {errors?.fileName && (
              <p className="mt-1 text-sm text-red-600">{errors.fileName.message}</p>
            )}
          </div>

          {/* File Size */}
          <div>
            <Label className="mb-1">
              File Size (bytes) *
            </Label>
            <Input
              {...form.register('digitalMeta.fileSize' as any, {
                valueAsNumber: true,
              })}
              type="number"
              placeholder="2048000"
              min="1"
              step="1"
            />
            <p className="mt-1 text-xs text-muted-foreground">File size in bytes (e.g., 2048000 = 2MB)</p>
            {errors?.fileSize && (
              <p className="mt-1 text-sm text-red-600">{errors.fileSize.message}</p>
            )}
          </div>

          {/* File Format */}
          <div>
            <Label className="mb-1">
              File Format *
            </Label>
            <Input
              {...form.register('digitalMeta.fileFormat' as any)}
              type="text"
              placeholder="pdf"
            />
            <p className="mt-1 text-xs text-muted-foreground">File format (e.g., pdf, zip, mp3)</p>
            {errors?.fileFormat && (
              <p className="mt-1 text-sm text-red-600">{errors.fileFormat.message}</p>
            )}
          </div>

          {/* Max Downloads */}
          <div>
            <Label className="mb-1">
              Max Downloads
            </Label>
            <Input
              {...form.register('digitalMeta.maxDownloads' as any, {
                valueAsNumber: true,
              })}
              type="number"
              placeholder="5"
              min="1"
              step="1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional - leave empty for unlimited downloads
            </p>
            {errors?.maxDownloads && (
              <p className="mt-1 text-sm text-red-600">{errors.maxDownloads.message}</p>
            )}
          </div>

          {/* Access Duration */}
          <div className="md:col-span-2">
            <Label className="mb-1">
              Access Duration (days)
            </Label>
            <Input
              {...form.register('digitalMeta.accessDuration' as any, {
                valueAsNumber: true,
              })}
              type="number"
              placeholder="30"
              min="1"
              step="1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional - number of days customer has access (leave empty for lifetime access)
            </p>
            {errors?.accessDuration && (
              <p className="mt-1 text-sm text-red-600">{errors.accessDuration.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
