'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export function useConfirm(): [React.FC, (opts: ConfirmOptions) => Promise<boolean>] {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    description: '',
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = useCallback((value: boolean) => {
    setOpen(false);
    resolveRef.current?.(value);
    resolveRef.current = null;
  }, []);

  const ConfirmDialog: React.FC = useCallback(
    () => (
      <Dialog open={open} onOpenChange={(v) => !v && handleClose(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options.title || 'Are you sure?'}</DialogTitle>
            <DialogDescription>{options.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              {options.cancelLabel || 'Cancel'}
            </Button>
            <Button
              variant={options.variant || 'default'}
              onClick={() => handleClose(true)}
            >
              {options.confirmLabel || 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
    [open, options, handleClose]
  );

  return [ConfirmDialog, confirm];
}
