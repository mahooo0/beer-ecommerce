'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import type { Tag } from '@repo/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';

const TAG_TYPE_OPTIONS = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'COLLECTION', label: 'Collection' },
  { value: 'BLOG', label: 'Blog' },
  { value: 'CUSTOM', label: 'Custom' },
];

interface TagSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
  onSuccess: () => void;
}

export function TagSheet({ open, onOpenChange, tag, onSuccess }: TagSheetProps) {
  const { getToken } = useAuth();
  const [name, setName] = useState(tag?.name || '');
  const [type, setType] = useState(tag?.type || 'PRODUCT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when tag prop changes
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setName(tag?.name || '');
      setType(tag?.type || 'PRODUCT');
      setError(null);
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      if (tag) {
        await api.tags.update(tag.id, { name: name.trim(), type }, token);
      } else {
        await api.tags.create({ name: name.trim(), type }, token);
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tag');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{tag ? 'Edit Tag' : 'Create Tag'}</SheetTitle>
          <SheetDescription>
            {tag ? 'Update the tag details below.' : 'Fill in the details to create a new tag.'}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAG_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Saving...' : tag ? 'Update Tag' : 'Create Tag'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
